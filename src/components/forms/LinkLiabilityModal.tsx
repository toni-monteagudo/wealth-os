"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { ILiability } from "@/types";

interface LinkLiabilityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    assetId: string;
    availableLiabilities: ILiability[];
}

export function LinkLiabilityModal({ isOpen, onClose, onSuccess, assetId, availableLiabilities }: LinkLiabilityModalProps) {
    const [loading, setLoading] = useState(false);
    const [selectedLiabilityId, setSelectedLiabilityId] = useState("");

    const unlinkedLiabilities = availableLiabilities.filter(l => !l.linkedAssetId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLiabilityId) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/liabilities/${selectedLiabilityId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ linkedAssetId: assetId }),
            });
            
            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                alert("Error vinculando el préstamo. Por favor, inténtalo de nuevo.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setSelectedLiabilityId("");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Vincular Préstamo al Activo">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {unlinkedLiabilities.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-500 text-center">
                        No tienes préstamos libres en el sistema. <br/>Debes crear uno nuevo desde la sección Préstamos primero.
                    </div>
                ) : (
                    <>
                        <div className="mb-2 text-sm text-slate-600">
                            Añade un préstamo existente a este activo. Ambos estarán sincronizados en tu patrimonio.
                        </div>
                        <FormField
                            label="Selecciona un préstamo libre"
                            name="liabilityId"
                            type="select"
                            value={selectedLiabilityId}
                            onChange={(e) => setSelectedLiabilityId(e.target.value)}
                            options={[
                                { label: "Elige uno...", value: "" },
                                ...unlinkedLiabilities.map(l => ({
                                    label: `${l.name} (${l.bank})`,
                                    value: l._id || ""
                                }))
                            ]}
                            required
                        />

                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
                                disabled={loading || !selectedLiabilityId}
                            >
                                {loading ? "Vinculando..." : "Vincular"}
                            </button>
                        </div>
                    </>
                )}
            </form>
        </Modal>
    );
}
