"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { IAsset } from "@/types";

interface LinkAssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    liabilityId: string;
    assets: IAsset[];
}

export function LinkAssetModal({ isOpen, onClose, onSuccess, liabilityId, assets }: LinkAssetModalProps) {
    const [loading, setLoading] = useState(false);
    const [selectedAssetId, setSelectedAssetId] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAssetId) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/liabilities/${liabilityId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ linkedAssetId: selectedAssetId }),
            });
            
            if (res.ok) {
                onSuccess();
                onClose();
            } else {
                alert("Error vinculando el activo. Por favor, inténtalo de nuevo.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setSelectedAssetId("");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Vincular a un Activo">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {assets.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-sm text-slate-500 text-center">
                        No tienes activos registrados. Crea uno primero en la sección Activos.
                    </div>
                ) : (
                    <>
                        <div className="mb-2 text-sm text-slate-600">
                            Asocia este préstamo a un inmueble o negocio para unificar el cuadro de mando.
                        </div>
                        <FormField
                            label="Selecciona tu activo"
                            name="assetId"
                            type="select"
                            value={selectedAssetId}
                            onChange={(e) => setSelectedAssetId(e.target.value)}
                            options={[
                                { label: "Elige activo...", value: "" },
                                ...assets.map(a => ({
                                    label: `${a.type === 'real_estate' ? '🏠' : '💼'} ${a.name} - ${(a.value / 1000).toFixed(0)}k`,
                                    value: a._id || ""
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
                                disabled={loading || !selectedAssetId}
                            >
                                {loading ? "Vinculando..." : "Vincular Activo"}
                            </button>
                        </div>
                    </>
                )}
            </form>
        </Modal>
    );
}
