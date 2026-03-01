"use client";

import React, { useState, useEffect } from "react";
import { Settings2, Save, CheckCircle2, Bot } from "lucide-react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { useI18n } from "@/i18n/I18nContext";
import { ISettings, ProviderConfig } from "@/types";

export default function ConfigurationPage() {
    const { t } = useI18n();
    const [settings, setSettings] = useState<ISettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch("/api/settings");
                const data = await res.json();
                setSettings(data);
            } catch (error) {
                console.error("Failed to load settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    if (loading || !settings) {
        return <div className="p-8 text-center text-slate-500">Cargando configuración...</div>;
    }

    const activeProviderObj = settings.providers.find(p => p.name === settings.activeProvider);

    const updateProviderConfig = (providerName: string, field: keyof ProviderConfig, value: string) => {
        setSettings(prev => {
            if (!prev) return prev;
            const updatedProviders = prev.providers.map(p => {
                if (p.name === providerName) {
                    return { ...p, [field]: value };
                }
                return p;
            });
            return { ...prev, providers: updatedProviders };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setSuccess(false);
        try {
            const res = await fetch("/api/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="p-6 lg:p-8 max-w-[1000px] mx-auto w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <Settings2 size={32} className="text-accent" /> {t("configuration.title")}
                </h1>
                <p className="text-sm font-medium text-slate-500 mt-2">{t("configuration.ai_settings_desc")}</p>
            </div>

            <PremiumCard className="p-8">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
                    <div className="size-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">{t("configuration.ai_settings")}</h2>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Active Provider Selector */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">{t("configuration.active_provider")}</label>
                        <div className="flex gap-4">
                            {['openai', 'anthropic', 'google'].map((provider) => (
                                <button
                                    key={provider}
                                    onClick={() => setSettings({ ...settings, activeProvider: provider as any })}
                                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all font-bold capitalize ${settings.activeProvider === provider
                                            ? 'border-accent bg-accent/5 text-accent'
                                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                                        }`}
                                >
                                    {provider}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Active Provider Config */}
                    {activeProviderObj && (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t("configuration.api_key")} ({activeProviderObj.name})</label>
                                <input
                                    type="password"
                                    value={activeProviderObj.apiKey}
                                    onChange={(e) => updateProviderConfig(activeProviderObj.name, 'apiKey', e.target.value)}
                                    placeholder={t("configuration.api_key_placeholder")}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 transition-shadow"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{t("configuration.model")}</label>
                                <input
                                    type="text"
                                    value={activeProviderObj.model}
                                    onChange={(e) => updateProviderConfig(activeProviderObj.name, 'model', e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-shadow"
                                />
                                <p className="text-[10px] text-slate-400 mt-2">Ej: gpt-4o, claude-3-5-sonnet-latest, gemini-1.5-pro</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
                    {success && <span className="text-emerald-600 text-sm font-bold flex items-center gap-1"><CheckCircle2 size={16} /> {t("configuration.success")}</span>}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                        <Save size={18} /> {saving ? t("configuration.saving") : t("configuration.save")}
                    </button>
                </div>

            </PremiumCard>
        </main>
    );
}
