"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { IProject, IAsset, ProjectType } from "@/types";
import { useApi } from "@/hooks/useApi";
import { useI18n } from "@/i18n/I18nContext";
import { Hammer, Plane, PartyPopper } from "lucide-react";

interface AddProjectFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const initialFormData: Partial<IProject> = {
    name: "",
    description: "",
    type: "renovation",
    budget: 0,
    actualSpent: 0,
    progress: 0,
    capitalize: true,
    estimatedEnd: "",
    startDate: "",
    destination: "",
    expenses: [],
    notes: [],
};

export function AddProjectForm({ isOpen, onClose, onSuccess }: AddProjectFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<IProject>>(initialFormData);
    const { data: assets } = useApi<IAsset[]>("/api/assets");
    const { t } = useI18n();

    useEffect(() => {
        if (isOpen) {
            setFormData(initialFormData);
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "number" ? Number(value) : value
        }));
    };

    const setProjectType = (type: ProjectType) => {
        setFormData(prev => ({
            ...prev,
            type,
            capitalize: type === "renovation",
            linkedAssetId: type === "renovation" ? prev.linkedAssetId : undefined,
            destination: type === "vacation" ? prev.destination : "",
            startDate: type === "renovation" ? "" : prev.startDate,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                onSuccess();
                onClose();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const activeType = formData.type ?? "renovation";

    const typeButtons: { type: ProjectType; icon: typeof Hammer; labelKey: string }[] = [
        { type: "renovation", icon: Hammer, labelKey: "type_renovation" },
        { type: "vacation", icon: Plane, labelKey: "type_vacation" },
        { type: "event", icon: PartyPopper, labelKey: "type_event" },
    ];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t("projects.new_project")}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Type Selector */}
                <div className="flex flex-col gap-1.5 mb-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {t("projects.select_type")}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {typeButtons.map(({ type, icon: Icon, labelKey }) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setProjectType(type)}
                                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                                    activeType === type
                                        ? "border-slate-900 bg-slate-900 text-white shadow-md"
                                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                                }`}
                            >
                                <Icon size={18} />
                                <span className="text-sm font-bold">{t(`projects.${labelKey}`)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <FormField
                    label="Nombre"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    placeholder={
                        activeType === "vacation" ? "Ej. Viaje a Filipinas 2026" :
                        activeType === "event" ? "Ej. Boda de Ana y Pedro" :
                        "Ej. Reforma Baño"
                    }
                    required
                />

                {activeType === "vacation" && (
                    <FormField
                        label={t("projects.destination")}
                        name="destination"
                        value={formData.destination || ""}
                        onChange={handleChange}
                        placeholder="Ej. Filipinas, Tailandia..."
                    />
                )}

                {activeType === "event" && (
                    <FormField
                        label={t("projects.venue")}
                        name="destination"
                        value={formData.destination || ""}
                        onChange={handleChange}
                        placeholder="Ej. Hotel W Barcelona"
                    />
                )}

                <FormField
                    label="Descripción"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleChange}
                    placeholder={
                        activeType === "vacation" ? "Breve descripción del viaje" :
                        activeType === "event" ? "Breve descripción del evento" :
                        "Breve descripción del proyecto"
                    }
                />

                <FormField
                    label="Presupuesto (€)"
                    name="budget"
                    type="number"
                    value={formData.budget || ""}
                    onChange={handleChange}
                    required
                />

                {(activeType === "vacation" || activeType === "event") && (
                    <FormField
                        label={activeType === "event" ? t("projects.event_date") : t("projects.start_date")}
                        name="startDate"
                        type="date"
                        value={formData.startDate || ""}
                        onChange={handleChange}
                    />
                )}

                <FormField
                    label={
                        activeType === "vacation" ? t("projects.return_date") :
                        activeType === "event" ? t("projects.estimated_end_date") :
                        "Fecha Estimada de Fin"
                    }
                    name="estimatedEnd"
                    type="date"
                    value={formData.estimatedEnd || ""}
                    onChange={handleChange}
                />

                {activeType === "renovation" && assets && assets.length > 0 && (
                    <FormField
                        label={t("projects.linked_asset")}
                        name="linkedAssetId"
                        type="select"
                        value={formData.linkedAssetId || ""}
                        onChange={handleChange}
                        options={[
                            { label: t("projects.select_asset"), value: "" },
                            ...assets.map(a => ({ label: a.name, value: a._id || "" })),
                        ]}
                    />
                )}

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
                        disabled={loading}
                    >
                        {loading ? "Guardando..." : "Guardar Proyecto"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
