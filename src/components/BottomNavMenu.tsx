import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
    HomeIcon,
    BuildingStorefrontIcon,
    ChatBubbleLeftIcon,
} from "@heroicons/react/24/solid";
import { useAuth } from "../hooks/useAuth";

export const BottomNavMenu: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    // No mostrar el menú si no está autenticado
    if (!isAuthenticated) {
        return null;
    }

    const menuItems = [
        {
            id: "home",
            label: "Home",
            icon: HomeIcon,
            gradient: "from-slate-600 to-slate-800",
            path: "/welcome",
        },
        {
            id: "veterinaria",
            label: "Veterinaria",
            icon: BuildingStorefrontIcon,
            gradient: "from-brand-500 to-cyan-500",
            path: "/veterinarias",
        },
    ];

    const handleWhatsApp = () => {
        // Número de WhatsApp (reemplaza con el tuyo)
        const phoneNumber = "549351230838"; // +54 9 3512 30-0838
        const message = encodeURIComponent(
            "Hola, tengo una consulta sobre los servicios de Vetfind."
        );
        window.open(
            `https://wa.me/${phoneNumber}?text=${message}`,
            "_blank"
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white/95 backdrop-blur-md to-transparent px-4 py-5 z-40 border-t border-gray-200/50 shadow-2xl"
        >
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-3">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <motion.button
                                key={item.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate(item.path)}
                                className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br ${item.gradient} text-white font-medium shadow-lg hover:shadow-xl transition-shadow duration-300`}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                <span
                                    className={`text-sm font-semibold ${
                                        item.id === "home"
                                            ? "max-[480px]:hidden"
                                            : ""
                                    }`}
                                >
                                    {item.label}
                                </span>
                            </motion.button>
                        );
                    })}
                    {/* WhatsApp Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleWhatsApp}
                        className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white font-medium shadow-lg hover:shadow-xl transition-shadow duration-300"
                        title="Contáctanos por WhatsApp"
                    >
                        <ChatBubbleLeftIcon className="w-5 h-5" />
                        <span className="text-sm font-semibold max-[480px]:hidden">Chat</span>
                    </motion.button>
                </div>
            </div>
        </motion.div>
    );
};
