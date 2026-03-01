"use client";

import React from "react";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    isDestructive = true,
}: ConfirmDialogProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} className="max-w-md">
            <p className="text-slate-600 text-sm mb-6">{message}</p>
            <div className="flex gap-3 justify-end">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                >
                    {cancelText}
                </button>
                <button
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors ${isDestructive ? "bg-rose-500 hover:bg-rose-600" : "bg-accent hover:bg-teal-600"
                        }`}
                >
                    {confirmText}
                </button>
            </div>
        </Modal>
    );
}
