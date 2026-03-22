"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    itemName: string;
    itemType: string;
    description?: string;
}

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, itemName, itemType, description }: ConfirmDeleteModalProps) {
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(false);

    const requiredPhrase = `deseo eliminar el ${itemType} ${itemName}`.toLowerCase();
    const isMatched = inputValue.toLowerCase().trim() === requiredPhrase;

    const handleConfirm = async () => {
        if (!isMatched) return;
        setLoading(true);
        try {
            await onConfirm();
        } finally {
            setLoading(false);
            setInputValue("");
        }
    };

    const handleClose = () => {
        setInputValue("");
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Cuidado: Acción Irreversible">
            <div className="flex flex-col gap-5">
                
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start gap-3 text-rose-800">
                    <AlertTriangle className="mt-0.5 shrink-0" size={20} />
                    <div className="text-sm">
                        <p className="font-bold mb-1">¿Estás completamente seguro?</p>
                        <p className="text-rose-700/80">{description || `Esta acción borrará permanentemente este ${itemType} y no se puede deshacer. Todos los datos, historiales de amortización y cálculos asociados a él desaparecerán.`}</p>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-600 mb-3">Para confirmar el borrado, por favor escribe la siguiente frase exactamente como aparece:</p>
                    <div className="select-all p-3 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-800 break-all shadow-sm flex items-center justify-center font-mono">
                         Deseo eliminar el {itemType} {itemName}
                    </div>
                </div>

                <FormField
                    label="Escribe la frase de confirmación aquí:"
                    name="confirmText"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={`Deseo eliminar el ${itemType} ${itemName}`}
                    autoComplete="off"
                />

                <div className="flex justify-end gap-3 mt-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!isMatched || loading}
                        className="px-4 py-2 bg-rose-600 text-white text-sm font-bold rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin"/> : null}
                        {loading ? "Eliminando..." : "Eliminar Permanentemente"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
