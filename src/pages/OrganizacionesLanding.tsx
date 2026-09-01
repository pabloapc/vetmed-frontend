import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const reveal = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 } as { opacity: number; y: number },
    viewport: { once: true },
    transition: { duration: 0.6, ease: "easeOut" as const, delay },
});

export const OrganizacionesLanding: React.FC = () => {
    useEffect(() => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href =
            "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap";
        document.head.appendChild(link);
        return () => {
            document.head.removeChild(link);
        };
    }, []);

    return (
        <div
            className="overflow-x-hidden"
            style={{
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                background: "#F7F5FF",
                color: "#3D2D6E",
            }}
        >
            {/* ── NAV ─────────────────────────────────────────── */}
            <nav
                className="fixed top-0 left-0 right-0 z-50 h-[68px] flex items-center justify-between px-8 md:px-12 border-b border-[#E0D6F5]"
                style={{
                    background: "rgba(247,245,255,.88)",
                    backdropFilter: "blur(20px) saturate(1.5)",
                }}
            >
                <div className="flex items-center gap-1">
                    <span className="text-2xl font-extrabold tracking-tight text-[#0D0028]">
                        GIMED
                    </span>
                    <span className="text-3xl font-extrabold text-[#5C16D4] leading-none">
                        +
                    </span>
                    <span className="text-[0.6rem] text-[#7A6DA0] tracking-widest font-medium uppercase ml-1 mt-1 hidden sm:block">
                        Assistance
                    </span>
                </div>
                <div className="hidden md:flex items-center gap-7">
                    {[
                        ["#servicios", "Servicios"],
                        ["#como", "Proceso"],
                        ["#impacto", "Impacto"],
                        ["#contacto", "Contacto"],
                    ].map(([href, label]) => (
                        <a
                            key={href}
                            href={href}
                            className="text-sm text-[#7A6DA0] hover:text-[#5C16D4] font-medium transition-colors"
                        >
                            {label}
                        </a>
                    ))}
                </div>
                <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#5C16D4] text-white text-sm font-semibold px-5 py-2.5 transition hover:-translate-y-px"
                    style={{ boxShadow: "0 4px 14px rgba(92,22,212,.3)" }}
                >
                    Iniciar sesión
                    <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" x2="3" y1="12" y2="12" />
                    </svg>
                </Link>
            </nav>

            {/* ── HERO ─────────────────────────────────────────── */}
            <section
                className="min-h-screen flex items-center pt-36 pb-20 px-6 relative overflow-hidden"
                style={{
                    background:
                        "linear-gradient(160deg,#fff 0%,#F4EEFF 40%,#F0EBFF 100%)",
                }}
            >
                {/* radial glow */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            "radial-gradient(ellipse 800px 600px at 70% 50%, rgba(92,22,212,.06) 0%, transparent 70%)",
                    }}
                />
                {/* grid pattern */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-25"
                    style={{
                        backgroundImage:
                            "linear-gradient(#E8DAFF 1px,transparent 1px),linear-gradient(90deg,#E8DAFF 1px,transparent 1px)",
                        backgroundSize: "40px 40px",
                    }}
                />

                <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-[1fr_420px] gap-16 items-center">
                    <div>
                        {/* badge */}
                        <motion.div
                            {...reveal()}
                            className="inline-flex items-center gap-2 rounded-full border border-[#E8DAFF] bg-[#F4EEFF] px-4 py-1.5 mb-6"
                        >
                            <span
                                className="w-2 h-2 rounded-full bg-[#00DDB0]"
                                style={{
                                    animation:
                                        "gimedPulse 2.2s ease-in-out infinite",
                                }}
                            />
                            <span className="text-xs font-semibold text-[#5C16D4] tracking-wide">
                                Plataforma de Salud Digital
                            </span>
                        </motion.div>

                        <motion.h1
                            {...reveal(0.08)}
                            className="font-extrabold leading-[1.06] tracking-tight text-[#0D0028] mb-5"
                            style={{
                                fontSize: "clamp(2.8rem,4.5vw,4rem)",
                            }}
                        >
                            La salud de tu equipo,{" "}
                            <span
                                style={{
                                    background:
                                        "linear-gradient(135deg,#5C16D4 0%,#7B3FF5 50%,#00DDB0 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                }}
                            >
                                transformada
                            </span>
                        </motion.h1>

                        <motion.p
                            {...reveal(0.16)}
                            className="text-[1.05rem] text-[#7A6DA0] leading-[1.8] max-w-[480px] mb-10"
                        >
                            <strong className="font-extrabold text-[#4400B8]">
                                GIMED+
                            </strong>{" "}
                            conecta organizaciones con prestadores de salud en
                            tiempo real. Menos burocracia, menos costo y mejor
                            bienestar para tu gente, todo en una sola app.
                        </motion.p>

                        <motion.div
                            {...reveal(0.24)}
                            className="flex items-center gap-4 flex-wrap mb-14"
                        >
                            <a
                                href="#contacto"
                                className="inline-flex items-center gap-2 rounded-full text-white text-sm font-semibold px-6 py-3 transition hover:-translate-y-px"
                                style={{
                                    background: "#5C16D4",
                                    boxShadow:
                                        "0 4px 14px rgba(92,22,212,.3)",
                                }}
                            >
                                Hablar con un asesor
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </a>
                            <a
                                href="#servicios"
                                className="inline-flex items-center gap-2 rounded-full text-[#5C16D4] text-sm font-semibold px-6 py-3 transition hover:bg-[#F4EEFF]"
                                style={{
                                    border: "1.5px solid #C4A8FF",
                                }}
                            >
                                Ver servicios
                            </a>
                        </motion.div>

                        {/* stats */}
                        <motion.div
                            {...reveal(0.32)}
                            className="flex gap-10 pt-6 border-t border-[#E0D6F5]"
                        >
                            {[
                                ["50%", "Ahorro en medicamentos"],
                                ["24/7", "Atención médica"],
                                ["1 app", "Todo centralizado"],
                            ].map(([n, l]) => (
                                <div key={l}>
                                    <div
                                        className="font-extrabold text-[#5C16D4] leading-none tracking-tight"
                                        style={{ fontSize: "1.9rem" }}
                                    >
                                        {n}
                                    </div>
                                    <div className="text-xs text-[#7A6DA0] mt-1 font-medium">
                                        {l}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* App mockup card */}
                    <motion.div
                        {...reveal(0.24)}
                        className="rounded-[28px] overflow-hidden w-full"
                        style={{
                            background: "#fff",
                            boxShadow:
                                "0 12px 40px rgba(92,22,212,.14),0 2px 8px rgba(92,22,212,.08),0 0 0 1px #E0D6F5",
                        }}
                    >
                        <div
                            className="p-7 pb-8"
                            style={{
                                background:
                                    "linear-gradient(135deg,#5C16D4 0%,#2E007F 100%)",
                            }}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <span className="text-base font-extrabold text-white tracking-tight">
                                    GIMED
                                    <span style={{ color: "#3BEED1" }}>+</span>
                                </span>
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#2E007F]"
                                    style={{
                                        background:
                                            "linear-gradient(135deg,#C4A8FF,#3BEED1)",
                                    }}
                                >
                                    MG
                                </div>
                            </div>
                            <div className="text-[0.7rem] text-white/50 mb-0.5">
                                Buen día,
                            </div>
                            <div className="text-base font-bold text-white mb-4">
                                María García
                            </div>
                            <div
                                className="rounded-2xl p-4"
                                style={{
                                    background: "rgba(255,255,255,.12)",
                                    border: "1px solid rgba(255,255,255,.2)",
                                }}
                            >
                                <div className="text-[0.65rem] text-white/50 uppercase tracking-widest mb-1">
                                    Ahorro acumulado este mes
                                </div>
                                <div
                                    className="text-2xl font-extrabold leading-none tracking-tight"
                                    style={{ color: "#3BEED1" }}
                                >
                                    $4.380
                                </div>
                                <div className="text-[0.67rem] text-white/50 mt-1">
                                    Red de farmacias GIMED · 12 operaciones
                                </div>
                            </div>
                        </div>
                        <div className="p-5 flex flex-col gap-2.5">
                            <div className="flex gap-2 flex-wrap mb-1">
                                {["Telemedicina", "Farmacias", "Auditoría"].map(
                                    (p, i) => (
                                        <span
                                            key={p}
                                            className="text-[0.7rem] font-semibold rounded-full px-3 py-1"
                                            style={
                                                i === 0
                                                    ? {
                                                          background:
                                                              "#EDFFF9",
                                                          border: "1px solid #C0FFF3",
                                                          color: "#00C49A",
                                                      }
                                                    : {
                                                          background:
                                                              "#F4EEFF",
                                                          border: "1px solid #E8DAFF",
                                                          color: "#5C16D4",
                                                      }
                                            }
                                        >
                                            {p}
                                        </span>
                                    )
                                )}
                            </div>
                            {[
                                {
                                    dot: "#00DDB0",
                                    title: "Consulta médica",
                                    sub: "Hoy 10:30 hs · Dr. Pérez",
                                    badge: "Activa",
                                    bStyle: {
                                        background: "#EDFFF9",
                                        color: "#00C49A",
                                    },
                                },
                                {
                                    dot: "#C4A8FF",
                                    title: "Receta cargada",
                                    sub: "Ayer · Farmacia Norte",
                                    badge: "OK",
                                    bStyle: {
                                        background: "#F4EEFF",
                                        color: "#5C16D4",
                                    },
                                },
                                {
                                    dot: "#C4A8FF",
                                    title: "Carpeta médica",
                                    sub: "En auditoría",
                                    badge: "Rev.",
                                    bStyle: {
                                        background: "#F4EEFF",
                                        color: "#5C16D4",
                                    },
                                },
                            ].map(({ dot, title, sub, badge, bStyle }) => (
                                <div
                                    key={title}
                                    className="flex items-center gap-3 rounded-xl p-3"
                                    style={{
                                        background: "#F7F5FF",
                                        border: "1px solid #E0D6F5",
                                    }}
                                >
                                    <div
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ background: dot }}
                                    />
                                    <div className="flex-1">
                                        <div className="text-[0.78rem] font-semibold text-[#0D0028]">
                                            {title}
                                        </div>
                                        <div className="text-[0.65rem] text-[#7A6DA0] mt-0.5">
                                            {sub}
                                        </div>
                                    </div>
                                    <span
                                        className="text-[0.62rem] font-bold px-2 py-0.5 rounded-full"
                                        style={bStyle}
                                    >
                                        {badge}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            <div className="h-px bg-[#E0D6F5]" />

            {/* ── SERVICIOS ────────────────────────────────────── */}
            <section id="servicios" className="py-24 bg-white">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-end mb-14">
                        <div>
                            <motion.div
                                {...reveal()}
                                className="flex items-center gap-2 text-xs font-bold text-[#7B3FF5] uppercase tracking-widest mb-4"
                            >
                                <span className="w-5 h-0.5 bg-[#00DDB0] rounded-full" />
                                Lo que ofrecemos
                            </motion.div>
                            <motion.h2
                                {...reveal(0.08)}
                                className="font-extrabold leading-[1.1] tracking-tight text-[#0D0028]"
                                style={{
                                    fontSize: "clamp(1.9rem,3.2vw,2.6rem)",
                                }}
                            >
                                Cuatro pilares de{" "}
                                <span className="text-[#5C16D4]">
                                    salud digital
                                </span>
                            </motion.h2>
                        </div>
                        <motion.p
                            {...reveal(0.16)}
                            className="text-base text-[#7A6DA0] leading-[1.8] max-w-lg"
                        >
                            Una plataforma unificada que cubre todo el ciclo de
                            salud de tus colaboradores, desde la consulta hasta
                            el seguimiento y la auditoría.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            {
                                n: "01",
                                title: "Cobertura en Medicamentos",
                                desc: "Hasta 50% de ahorro en nuestra red de farmacias adheridas. Acceso inmediato sin trámites adicionales, directo desde la app.",
                                icon: (
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#5C16D4"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                                        <path d="m8.5 8.5 7 7" />
                                    </svg>
                                ),
                            },
                            {
                                n: "02",
                                title: "Telemedicina 24/7",
                                desc: "Videoconsultas con médicos especializados disponibles las 24 horas. Sin esperas ni traslados, desde cualquier dispositivo.",
                                icon: (
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#5C16D4"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="m22 8-6 4 6 4V8Z" />
                                        <rect
                                            width="14"
                                            height="12"
                                            x="2"
                                            y="6"
                                            rx="2"
                                            ry="2"
                                        />
                                    </svg>
                                ),
                            },
                            {
                                n: "03",
                                title: "Red de Prestadores",
                                desc: "Farmacias, médicos y especialistas en una sola red unificada. Una plataforma, cero intermediaciones operativas.",
                                icon: (
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#5C16D4"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <rect
                                            x="16"
                                            y="16"
                                            width="6"
                                            height="6"
                                            rx="1"
                                        />
                                        <rect
                                            x="2"
                                            y="16"
                                            width="6"
                                            height="6"
                                            rx="1"
                                        />
                                        <rect
                                            x="9"
                                            y="2"
                                            width="6"
                                            height="6"
                                            rx="1"
                                        />
                                        <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
                                        <path d="M12 12V8" />
                                    </svg>
                                ),
                            },
                            {
                                n: "04",
                                title: "App Unificada",
                                desc: "Toda la gestión de salud corporativa en una sola aplicación intuitiva. Implementación en días, no en meses.",
                                icon: (
                                    <svg
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#5C16D4"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <rect
                                            width="14"
                                            height="20"
                                            x="5"
                                            y="2"
                                            rx="2"
                                            ry="2"
                                        />
                                        <path d="M12 18h.01" />
                                    </svg>
                                ),
                            },
                        ].map(({ n, title, desc, icon }, i) => (
                            <motion.div
                                key={n}
                                {...reveal(i * 0.08)}
                                className="rounded-[20px] p-9 border border-[#E0D6F5] bg-white cursor-default relative overflow-hidden group transition-all hover:-translate-y-1"
                                style={{
                                    boxShadow:
                                        "0 1px 3px rgba(92,22,212,.07)",
                                }}
                            >
                                <div
                                    className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{
                                        background:
                                            "linear-gradient(90deg,#7B3FF5,#00DDB0)",
                                    }}
                                />
                                <div className="text-[0.68rem] font-bold tracking-[2px] text-[#B0A8C8] mb-5">
                                    {n}
                                </div>
                                <div
                                    className="w-[52px] h-[52px] rounded-2xl mb-5 flex items-center justify-center border border-[#E8DAFF] group-hover:bg-[#E8DAFF] transition-colors"
                                    style={{ background: "#F4EEFF" }}
                                >
                                    {icon}
                                </div>
                                <div className="text-[1.1rem] font-bold text-[#0D0028] mb-2">
                                    {title}
                                </div>
                                <div className="text-sm text-[#7A6DA0] leading-[1.7]">
                                    {desc}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="h-px bg-[#E0D6F5]" />

            {/* ── PROCESO ──────────────────────────────────────── */}
            <section
                id="como"
                className="py-24"
                style={{ background: "#F0EBFF" }}
            >
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center max-w-xl mx-auto mb-14">
                        <motion.div
                            {...reveal()}
                            className="flex items-center justify-center gap-2 text-xs font-bold text-[#7B3FF5] uppercase tracking-widest mb-4"
                        >
                            <span className="w-5 h-0.5 bg-[#00DDB0] rounded-full" />
                            Proceso
                        </motion.div>
                        <motion.h2
                            {...reveal(0.08)}
                            className="font-extrabold leading-[1.1] tracking-tight text-[#0D0028] mb-4"
                            style={{
                                fontSize: "clamp(1.9rem,3.2vw,2.6rem)",
                            }}
                        >
                            Auditoría de{" "}
                            <span className="text-[#5C16D4]">
                                carpeta médica
                            </span>
                        </motion.h2>
                        <motion.p
                            {...reveal(0.16)}
                            className="text-base text-[#7A6DA0] leading-[1.8]"
                        >
                            Sin intermediación operativa. En cuatro pasos, tu
                            organización accede a un sistema de salud digital
                            completo y auditable.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                        {/* connector line */}
                        <div
                            className="hidden md:block absolute top-8 h-px opacity-60"
                            style={{
                                left: "calc(12.5% + 32px)",
                                right: "calc(12.5% + 32px)",
                                background:
                                    "linear-gradient(90deg,#C4A8FF,#3BEED1,#C4A8FF)",
                            }}
                        />
                        {[
                            {
                                title: "Diagnóstico",
                                desc: "El empleado recibe su diagnóstico médico y los días de reposo indicados.",
                                icon: (
                                    <svg
                                        width="26"
                                        height="26"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#fff"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                                        <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
                                        <circle cx="20" cy="10" r="2" />
                                    </svg>
                                ),
                            },
                            {
                                title: "Carga digital",
                                desc: "Sube la receta a la app en segundos desde su teléfono.",
                                icon: (
                                    <svg
                                        width="26"
                                        height="26"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#fff"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" x2="12" y1="3" y2="15" />
                                    </svg>
                                ),
                            },
                            {
                                title: "Auditoría",
                                desc: "El sistema valida automáticamente la autenticidad de la información cargada.",
                                icon: (
                                    <svg
                                        width="26"
                                        height="26"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#fff"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        <path d="m9 12 2 2 4-4" />
                                    </svg>
                                ),
                            },
                            {
                                title: "Seguimiento",
                                desc: "Control en tiempo real con geolocalización GPS y contacto activo.",
                                icon: (
                                    <svg
                                        width="26"
                                        height="26"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#fff"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                    </svg>
                                ),
                            },
                        ].map(({ title, desc, icon }, i) => (
                            <motion.div
                                key={title}
                                {...reveal(i * 0.08)}
                                className="text-center relative"
                            >
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 relative z-10"
                                    style={{
                                        background:
                                            "linear-gradient(135deg,#5C16D4 0%,#4400B8 100%)",
                                        border: "3px solid #fff",
                                        boxShadow:
                                            "0 0 0 2px #C4A8FF, 0 4px 16px rgba(92,22,212,.2)",
                                    }}
                                >
                                    {icon}
                                </div>
                                <div className="text-base font-bold text-[#0D0028] mb-2">
                                    {title}
                                </div>
                                <div className="text-sm text-[#7A6DA0] leading-[1.6]">
                                    {desc}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="h-px bg-[#E0D6F5]" />

            {/* ── IMPACTO ───────────────────────────────────────── */}
            <section id="impacto" className="py-24 bg-white">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                        <div>
                            <motion.div
                                {...reveal()}
                                className="flex items-center gap-2 text-xs font-bold text-[#7B3FF5] uppercase tracking-widest mb-4"
                            >
                                <span className="w-5 h-0.5 bg-[#00DDB0] rounded-full" />
                                Resultados concretos
                            </motion.div>
                            <motion.h2
                                {...reveal(0.08)}
                                className="font-extrabold leading-[1.1] tracking-tight text-[#0D0028] mb-4"
                                style={{
                                    fontSize: "clamp(1.9rem,3.2vw,2.6rem)",
                                }}
                            >
                                Impacto real para tu{" "}
                                <span className="text-[#5C16D4]">
                                    organización
                                </span>
                            </motion.h2>
                            <motion.p
                                {...reveal(0.16)}
                                className="text-base text-[#7A6DA0] leading-[1.8] mb-8"
                            >
                                <strong className="font-extrabold text-[#4400B8]">
                                    GIMED
                                </strong>{" "}
                                no solo mejora el bienestar de tus colaboradores
                                — genera métricas claras de retorno sobre la
                                inversión desde el primer mes.
                            </motion.p>
                            <motion.div {...reveal(0.24)}>
                                <a
                                    href="#contacto"
                                    className="inline-flex items-center gap-2 rounded-full text-white text-sm font-semibold px-6 py-3 transition hover:-translate-y-px"
                                    style={{
                                        background: "#5C16D4",
                                        boxShadow:
                                            "0 4px 14px rgba(92,22,212,.3)",
                                    }}
                                >
                                    Hablar con un asesor
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </a>
                            </motion.div>
                        </div>

                        <div className="flex flex-col gap-4">
                            {[
                                {
                                    big: "−50%",
                                    title: "Costo en medicamentos",
                                    desc: "Acceso directo a la red de farmacias sin intermediarios, con ahorro mensual sostenido y medible.",
                                    icon: (
                                        <svg
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#5C16D4"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
                                            <polyline points="16 17 22 17 22 11" />
                                        </svg>
                                    ),
                                },
                                {
                                    big: "↓ Ausentismo",
                                    title: "Menor ausentismo laboral",
                                    desc: "La auditoría activa reduce el uso indebido de licencias con datos verificables y trazables.",
                                    icon: (
                                        <svg
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#5C16D4"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <polyline points="16 11 18 13 22 9" />
                                        </svg>
                                    ),
                                },
                                {
                                    big: "+ Bienestar",
                                    title: "Beneficio diferencial",
                                    desc: "Atención de calidad y accesible que fideliza talento y mejora el clima organizacional.",
                                    icon: (
                                        <svg
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#5C16D4"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                                            <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
                                        </svg>
                                    ),
                                },
                            ].map(({ big, title, desc, icon }, i) => (
                                <motion.div
                                    key={title}
                                    {...reveal(i * 0.08)}
                                    className="flex items-center gap-5 rounded-[20px] p-5 border border-[#E0D6F5] bg-white transition hover:border-[#C4A8FF]"
                                    style={{
                                        boxShadow:
                                            "0 1px 3px rgba(92,22,212,.07)",
                                    }}
                                >
                                    <div
                                        className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-[1.5px] border-[#E8DAFF]"
                                        style={{ background: "#F4EEFF" }}
                                    >
                                        {icon}
                                    </div>
                                    <div>
                                        <div
                                            className="font-extrabold text-[#5C16D4] tracking-tight mb-0.5"
                                            style={{ fontSize: "1.5rem" }}
                                        >
                                            {big}
                                        </div>
                                        <div className="text-sm font-bold text-[#0D0028] mb-0.5">
                                            {title}
                                        </div>
                                        <div className="text-sm text-[#7A6DA0] leading-[1.5]">
                                            {desc}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <div className="h-px bg-[#E0D6F5]" />

            {/* ── ESCALABLE ─────────────────────────────────────── */}
            <section className="py-24" style={{ background: "#F0EBFF" }}>
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-end mb-12">
                        <div>
                            <motion.div
                                {...reveal()}
                                className="flex items-center gap-2 text-xs font-bold text-[#7B3FF5] uppercase tracking-widest mb-4"
                            >
                                <span className="w-5 h-0.5 bg-[#00DDB0] rounded-full" />
                                Para toda organización
                            </motion.div>
                            <motion.h2
                                {...reveal(0.08)}
                                className="font-extrabold leading-[1.1] tracking-tight text-[#0D0028]"
                                style={{
                                    fontSize: "clamp(1.9rem,3.2vw,2.6rem)",
                                }}
                            >
                                Un modelo{" "}
                                <span className="text-[#5C16D4]">
                                    adaptable
                                </span>{" "}
                                a tu escala
                            </motion.h2>
                        </div>
                        <motion.p
                            {...reveal(0.16)}
                            className="text-base text-[#7A6DA0] leading-[1.8] pt-6"
                        >
                            <strong className="font-extrabold text-[#4400B8]">
                                GIMED
                            </strong>{" "}
                            se implementa sin infraestructura propia y se
                            integra a cualquier estructura organizacional en
                            días, no meses.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            {
                                n: "01",
                                title: "Grandes empresas",
                                desc: "Soluciones para corporaciones con miles de empleados y múltiples sedes, con reportes consolidados en tiempo real.",
                                icon: (
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#5C16D4"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                                        <path d="M6 12H4a2 2 0 0 0-2 2v8h4" />
                                        <path d="M18 9h2a2 2 0 0 1 2 2v11h-4" />
                                        <path d="M10 6h4" />
                                        <path d="M10 10h4" />
                                        <path d="M10 14h4" />
                                        <path d="M10 18h4" />
                                    </svg>
                                ),
                            },
                            {
                                n: "02",
                                title: "Sector público",
                                desc: "Adaptada a normativas y procesos de organismos públicos con cumplimiento regulatorio garantizado en cada etapa.",
                                icon: (
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#5C16D4"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <line x1="3" x2="21" y1="22" y2="22" />
                                        <line x1="6" x2="6" y1="18" y2="11" />
                                        <line
                                            x1="10"
                                            x2="10"
                                            y1="18"
                                            y2="11"
                                        />
                                        <line
                                            x1="14"
                                            x2="14"
                                            y1="18"
                                            y2="11"
                                        />
                                        <line
                                            x1="18"
                                            x2="18"
                                            y1="18"
                                            y2="11"
                                        />
                                        <polygon points="12 2 20 7 4 7" />
                                    </svg>
                                ),
                            },
                            {
                                n: "03",
                                title: "Redes de afiliados",
                                desc: "Gestión unificada para grupos con membresías diversas y distribuidas en múltiples localidades del país.",
                                icon: (
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#5C16D4"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                ),
                            },
                            {
                                n: "04",
                                title: "Grupos corporativos",
                                desc: "Integración eficiente para holdings y conglomerados empresariales con visibilidad de datos agregados.",
                                icon: (
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#5C16D4"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <rect
                                            width="20"
                                            height="14"
                                            x="2"
                                            y="7"
                                            rx="2"
                                            ry="2"
                                        />
                                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                    </svg>
                                ),
                            },
                        ].map(({ n, title, desc, icon }, i) => (
                            <motion.div
                                key={n}
                                {...reveal(i * 0.08)}
                                className="rounded-[20px] p-8 bg-white border border-[#E0D6F5] transition-all hover:-translate-y-0.5"
                                style={{
                                    boxShadow:
                                        "0 1px 3px rgba(92,22,212,.07)",
                                }}
                            >
                                <div
                                    className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-sm font-extrabold text-[#5C16D4] mb-4 border border-[#E8DAFF]"
                                    style={{ background: "#F4EEFF" }}
                                >
                                    {n}
                                </div>
                                <div className="flex items-center gap-2.5 mb-2">
                                    {icon}
                                    <div className="text-base font-bold text-[#0D0028]">
                                        {title}
                                    </div>
                                </div>
                                <div className="text-sm text-[#7A6DA0] leading-[1.6]">
                                    {desc}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="h-px bg-[#E0D6F5]" />

            {/* ── AUDITORÍA — dark ──────────────────────────────── */}
            <section className="py-24" style={{ background: "#1A0060" }}>
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center max-w-xl mx-auto mb-14">
                        <motion.div
                            {...reveal()}
                            className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest mb-4"
                            style={{ color: "#3BEED1" }}
                        >
                            <span
                                className="w-5 h-0.5 rounded-full"
                                style={{ background: "#3BEED1" }}
                            />
                            Control total
                        </motion.div>
                        <motion.h2
                            {...reveal(0.08)}
                            className="font-extrabold leading-[1.1] tracking-tight text-white mb-4"
                            style={{
                                fontSize: "clamp(1.9rem,3.2vw,2.6rem)",
                            }}
                        >
                            Auditoría de carpetas{" "}
                            <span style={{ color: "#3BEED1" }}>médicas</span>
                        </motion.h2>
                        <motion.p
                            {...reveal(0.16)}
                            className="text-base leading-[1.8]"
                            style={{ color: "rgba(255,255,255,.6)" }}
                        >
                            Trazabilidad completa de cada licencia médica con
                            cuatro pasos que eliminan el uso indebido.
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            {
                                step: "Paso 01",
                                title: "Diagnóstico médico",
                                desc: "El empleado asiste al médico y recibe su diagnóstico con los días de reposo indicados para su cuadro clínico.",
                            },
                            {
                                step: "Paso 02",
                                title: "Carga en la app",
                                desc: "Carga la receta médica en la app GIMED en menos de dos minutos. Sin papeles, sin traslados ni ventanillas.",
                            },
                            {
                                step: "Paso 03",
                                title: "Auditoría automática",
                                desc: "El sistema activa automáticamente un proceso de validación que verifica la autenticidad de cada información.",
                            },
                            {
                                step: "Paso 04",
                                title: "Seguimiento digital",
                                desc: "Control continuo durante la licencia con geolocalización GPS y contacto activo en distintos momentos del día.",
                            },
                        ].map(({ step, title, desc }, i) => (
                            <motion.div
                                key={step}
                                {...reveal(i * 0.08)}
                                className="rounded-[20px] p-7 transition-all"
                                style={{
                                    background: "rgba(255,255,255,.08)",
                                    border: "1px solid rgba(255,255,255,.14)",
                                }}
                            >
                                <div
                                    className="inline-block text-[0.68rem] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-4"
                                    style={{
                                        background: "rgba(0,221,176,.15)",
                                        border: "1px solid rgba(0,221,176,.3)",
                                        color: "#3BEED1",
                                    }}
                                >
                                    {step}
                                </div>
                                <div className="text-base font-bold text-white mb-2">
                                    {title}
                                </div>
                                <div
                                    className="text-sm leading-[1.65]"
                                    style={{ color: "rgba(255,255,255,.65)" }}
                                >
                                    {desc}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="h-px bg-[#E0D6F5]" />

            {/* ── SEGUIMIENTO ───────────────────────────────────── */}
            <section className="py-24" style={{ background: "#EAF9F6" }}>
                <div className="max-w-6xl mx-auto px-6">
                    <motion.div
                        {...reveal()}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-4"
                        style={{ color: "#00C49A" }}
                    >
                        <span
                            className="w-5 h-0.5 rounded-full"
                            style={{ background: "#00C49A" }}
                        />
                        Monitoreo activo
                    </motion.div>
                    <motion.h2
                        {...reveal(0.08)}
                        className="font-extrabold leading-[1.1] tracking-tight text-[#0D0028] mb-3"
                        style={{ fontSize: "clamp(1.9rem,3.2vw,2.6rem)" }}
                    >
                        Seguimiento y{" "}
                        <span style={{ color: "#00C49A" }}>cumplimiento</span>
                    </motion.h2>
                    <motion.p
                        {...reveal(0.16)}
                        className="text-base text-[#7A6DA0] leading-[1.8] max-w-xl mb-12"
                    >
                        Nuestro equipo médico no solo registra: actúa.
                        Verificación activa del cumplimiento de cada licencia,
                        en tiempo real.
                    </motion.p>

                    <div className="grid grid-cols-1 md:grid-cols-2 border-t border-[#E0D6F5]">
                        {[
                            {
                                title: "Geolocalización GPS",
                                desc: "Verificación del reposo en domicilio mediante geolocalización vía app GIMED en tiempo real, de manera transparente.",
                            },
                            {
                                title: "Seguimiento remoto",
                                desc: "El equipo médico GIMED realiza seguimiento activo al empleado durante todo el período de licencia indicado.",
                            },
                            {
                                title: "Validación continua",
                                desc: "Contacto en distintos momentos del día para validar el cumplimiento efectivo del reposo médico prescripto.",
                            },
                            {
                                title: "Informe automático",
                                desc: "En caso de incumplimiento, se genera automáticamente un informe formal para la empresa con datos verificados.",
                            },
                        ].map(({ title, desc }, i) => (
                            <motion.div
                                key={title}
                                {...reveal(i * 0.08)}
                                className={`py-8 border-b border-[#E0D6F5] ${
                                    i % 2 === 0
                                        ? "pr-12"
                                        : "pl-12 border-l border-[#E0D6F5]"
                                }`}
                            >
                                <div
                                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 border border-[#C0FFF3]"
                                    style={{ background: "#EDFFF9" }}
                                >
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#00C49A"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="m9 12 2 2 4-4" />
                                    </svg>
                                </div>
                                <div className="text-base font-bold text-[#0D0028] mb-2">
                                    {title}
                                </div>
                                <div className="text-sm text-[#7A6DA0] leading-[1.7]">
                                    {desc}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ───────────────────────────────────────────── */}
            <section
                className="py-28 relative overflow-hidden"
                style={{
                    background:
                        "linear-gradient(135deg,#2E007F 0%,#5C16D4 55%,#3B1BA8 100%)",
                }}
            >
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            "radial-gradient(ellipse 600px 400px at 80% 50%,rgba(0,221,176,.12) 0%,transparent 70%)",
                    }}
                />
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)",
                        backgroundSize: "40px 40px",
                        opacity: 0.4,
                    }}
                />
                <div className="max-w-2xl mx-auto px-6 text-center relative z-10">
                    <motion.div
                        {...reveal()}
                        className="text-[0.72rem] font-semibold uppercase tracking-[3px] mb-5"
                        style={{ color: "rgba(255,255,255,.5)" }}
                    >
                        GIMED+ Assistance
                    </motion.div>
                    <motion.h2
                        {...reveal(0.08)}
                        className="font-extrabold leading-[1.05] tracking-tight text-white mb-5"
                        style={{ fontSize: "clamp(2.4rem,4.5vw,3.8rem)" }}
                    >
                        Menos costo.
                        <br />
                        <span style={{ color: "#3BEED1" }}>Más acceso.</span>
                        <br />
                        Mejor experiencia.
                    </motion.h2>
                    <motion.p
                        {...reveal(0.16)}
                        className="text-base leading-[1.75] mb-10"
                        style={{ color: "rgba(255,255,255,.65)" }}
                    >
                        Transforma la forma en que tu organización brinda salud.
                        Implementación en días, resultados desde el primer mes.
                    </motion.p>
                    <motion.div
                        {...reveal(0.24)}
                        className="flex justify-center gap-4 flex-wrap"
                    >
                        <a
                            href="#contacto"
                            className="inline-flex items-center gap-2 rounded-full text-[0.96rem] font-semibold px-7 py-3 transition hover:-translate-y-px"
                            style={{
                                background: "#00DDB0",
                                color: "#1A0060",
                                boxShadow: "0 4px 14px rgba(0,196,154,.28)",
                            }}
                        >
                            Contactar ahora
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </a>
                        <a
                            href="tel:+5493512309838"
                            className="inline-flex items-center gap-2 rounded-full text-[0.96rem] font-semibold px-7 py-3"
                            style={{
                                background: "rgba(255,255,255,.12)",
                                color: "#fff",
                                border: "1.5px solid rgba(255,255,255,.25)",
                            }}
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 9a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.92 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            +54 9 351 230 9838
                        </a>
                    </motion.div>
                </div>
            </section>

            {/* ── CONTACTO ─────────────────────────────────────── */}
            <section id="contacto" className="py-24 bg-white">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                        <div>
                            <motion.div
                                {...reveal()}
                                className="flex items-center gap-2 text-xs font-bold text-[#7B3FF5] uppercase tracking-widest mb-4"
                            >
                                <span className="w-5 h-0.5 bg-[#00DDB0] rounded-full" />
                                Hablemos
                            </motion.div>
                            <motion.h2
                                {...reveal(0.08)}
                                className="font-extrabold leading-[1.1] tracking-tight text-[#0D0028] mb-4"
                                style={{
                                    fontSize: "clamp(1.9rem,3.2vw,2.6rem)",
                                }}
                            >
                                ¿Listo para{" "}
                                <span className="text-[#5C16D4]">
                                    transformar
                                </span>
                                <br />
                                la salud de tu equipo?
                            </motion.h2>
                            <motion.p
                                {...reveal(0.16)}
                                className="text-base text-[#7A6DA0] leading-[1.8]"
                            >
                                Nuestro equipo está disponible para responder
                                tus preguntas y mostrarte cómo{" "}
                                <strong className="font-extrabold text-[#4400B8]">
                                    GIMED+
                                </strong>{" "}
                                se adapta puntualmente a tu organización.
                            </motion.p>
                        </div>

                        <div className="flex flex-col gap-3">
                            {[
                                {
                                    href: "mailto:soporte@gimed.app",
                                    label: "Email",
                                    val: "soporte@gimed.app",
                                    icon: (
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#5C16D4"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <rect
                                                width="20"
                                                height="16"
                                                x="2"
                                                y="4"
                                                rx="2"
                                            />
                                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                        </svg>
                                    ),
                                },
                                {
                                    href: "tel:+5493512309838",
                                    label: "Teléfono",
                                    val: "+54 9 351 230 9838",
                                    icon: (
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#5C16D4"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.99 9a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.92 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                                        </svg>
                                    ),
                                },
                                {
                                    href: "https://instagram.com/gimed.salud",
                                    label: "Instagram",
                                    val: "@gimed.salud",
                                    icon: (
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#5C16D4"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <rect
                                                x="2"
                                                y="2"
                                                width="20"
                                                height="20"
                                                rx="5"
                                                ry="5"
                                            />
                                            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                            <line
                                                x1="17.5"
                                                x2="17.51"
                                                y1="6.5"
                                                y2="6.5"
                                            />
                                        </svg>
                                    ),
                                },
                            ].map(({ href, label, val, icon }, i) => (
                                <motion.a
                                    key={label}
                                    {...reveal(i * 0.08)}
                                    href={href}
                                    className="flex items-center gap-4 rounded-[20px] p-5 border border-[#E0D6F5] bg-white transition-all hover:border-[#C4A8FF] hover:translate-x-1"
                                    style={{
                                        boxShadow:
                                            "0 1px 3px rgba(92,22,212,.07)",
                                        textDecoration: "none",
                                    }}
                                >
                                    <div
                                        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-[#E8DAFF]"
                                        style={{ background: "#F4EEFF" }}
                                    >
                                        {icon}
                                    </div>
                                    <div>
                                        <div className="text-[0.72rem] text-[#7A6DA0] font-medium uppercase tracking-wider mb-0.5">
                                            {label}
                                        </div>
                                        <div className="text-sm font-semibold text-[#0D0028]">
                                            {val}
                                        </div>
                                    </div>
                                    <svg
                                        className="ml-auto opacity-30"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#5C16D4"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </motion.a>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FOOTER ────────────────────────────────────────── */}
            <footer
                className="flex flex-col md:flex-row items-center justify-between gap-3 px-8 md:px-12 py-6"
                style={{ background: "#0D0028" }}
            >
                <div className="text-[1.1rem] font-extrabold text-white tracking-tight">
                    GIMED<span style={{ color: "#00DDB0" }}>+</span>
                </div>
                <p
                    className="text-[0.8rem]"
                    style={{ color: "rgba(255,255,255,.3)" }}
                >
                    © {new Date().getFullYear()} Gimed. Todos los derechos
                    reservados.
                </p>
                <Link
                    to="/"
                    className="text-[0.8rem] transition hover:opacity-80"
                    style={{ color: "rgba(255,255,255,.4)" }}
                >
                    Volver al inicio →
                </Link>
            </footer>

            {/* pulse keyframe */}
            <style>{`
                @keyframes gimedPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(0,221,176,.4); }
                    50%       { box-shadow: 0 0 0 6px rgba(0,221,176,0); }
                }
            `}</style>
        </div>
    );
};

export default OrganizacionesLanding;
