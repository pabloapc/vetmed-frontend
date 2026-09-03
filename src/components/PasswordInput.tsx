import React, { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

type Props = {
    id?: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
    autoComplete?: string;
    className?: string;
};

const PasswordInput: React.FC<Props> = ({
    id,
    name,
    value,
    onChange,
    placeholder,
    required = false,
    autoComplete = "new-password",
    className = "",
}) => {
    const [visible, setVisible] = useState(false);

    return (
        <div className={`relative ${className}`}>
            <label htmlFor={id || name} className="sr-only">
                {name}
            </label>
            <input
                id={id || name}
                name={name}
                type={visible ? "text" : "password"}
                autoComplete={autoComplete}
                required={required}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="mt-1 block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                aria-invalid="false"
            />

            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-500"
                aria-label={
                    visible ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                title={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
                {visible ? (
                    <EyeSlashIcon className="w-5 h-5" aria-hidden="true" />
                ) : (
                    <EyeIcon className="w-5 h-5" aria-hidden="true" />
                )}
            </button>
        </div>
    );
};

export default PasswordInput;
