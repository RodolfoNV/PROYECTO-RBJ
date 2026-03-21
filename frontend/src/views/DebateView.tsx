import React, { useState } from 'react';

interface Persona {
    id: string;
    name: string;
    role: string;
    bio: string;
    avatar: string;
    color: string;
}

interface Message {
    id: number;
    personaId: string;
    text: string;
    type: 'argument' | 'counter' | 'verdict';
}

const PERSONAS: Persona[] = [
    {
        id: 'mara',
        name: 'Mara Chen',
        role: '"La Conservadora"',
        bio: 'Ingeniera líder pragmática. Defiende la priorización estricta y evita el desperdicio de recursos en documentación obsoleta.',
        avatar: '👩‍💼',
        color: '#f87171' // Red-ish
    },
    {
        id: 'dev',
        name: 'Dev Okafor',
        role: '"El Renovador"',
        bio: 'Defensor de los desarrolladores. Cree que los tutoriales defectuosos dañan la reputación y alejan a los nuevos talentos.',
        avatar: '👨‍💻',
        color: '#60a5fa' // Blue-ish
    },
    {
        id: 'adaeze',
        name: 'Adaeze Nwankwo',
        role: '"El Árbitro"',
        bio: 'Directora sénior de ingeniería. Evalúa argumentos basados en evidencia, lógica y viabilidad práctica para emitir un veredicto.',
        avatar: '⚖️',
        color: '#fbbf24' // Gold-ish
    }
];

const DEBATE_CONTENT: Message[] = [
    {
        id: 1,
        personaId: 'mara',
        type: 'argument',
        text: '¿Cuál es el costo de oportunidad? Cada hora que dedicamos a arreglar tutoriales de BasicPay es una hora que no dedicamos al núcleo del protocolo Stellar. La documentación siempre estará un paso atrás; es una deuda técnica silenciosa que no podemos permitirnos alimentar sin un retorno claro.'
    },
    {
        id: 2,
        personaId: 'dev',
        type: 'counter',
        text: 'Mara, solo tenemos una oportunidad para causar una buena primera impresión. Un tutorial roto no es solo un error técnico; es una traición a la promesa que le hacemos al desarrollador. Si el "Hola Mundo" no funciona, ¿por qué confiarían en el resto de nuestra infraestructura?'
    },
    {
        id: 3,
        personaId: 'mara',
        type: 'argument',
        text: 'Entiendo el punto, pero los datos no mienten. Ese tutorial recibe pocas visitas. Redistribuir recursos de ingeniería para algo con tan bajo impacto es ineficiente. A veces, la respuesta honesta es descontinuar lo que no podemos mantener en lugar de intentar arreglarlo todo.'
    },
    {
        id: 4,
        personaId: 'dev',
        type: 'counter',
        text: 'La tasa de abandono en el embudo de desarrollo es crítica. No vemos a los desarrolladores que se van frustrados sin decir nada. Arreglarlo no es solo mantenimiento; es una inversión estratégica en el crecimiento de nuestro ecosistema. El costo de perder un desarrollador talentoso es infinitamente mayor.'
    },
    {
        id: 5,
        personaId: 'adaeze',
        type: 'verdict',
        text: 'Veredicto: Ambos puntos son válidos, pero la reputación de la plataforma es el activo más valioso. Se ordena la corrección del tutorial, pero bajo un modelo de "Documentación como Código" para asegurar que futuras actualizaciones sean automatizadas y no vuelvan a quedar obsoletas. La calidad no es negociable, pero la eficiencia en su mantenimiento sí.'
    }
];

export function DebateView() {
    const [visibleMessages, setVisibleMessages] = useState<number>(0);

    const showNext = () => {
        if (visibleMessages < DEBATE_CONTENT.length) {
            setVisibleMessages(prev => prev + 1);
        }
    };

    return (
        <div className="fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{
                    fontSize: '2.8rem',
                    fontWeight: 900,
                    fontFamily: "'Syne', sans-serif",
                    background: 'var(--grad-primary)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '0.75rem',
                    letterSpacing: '-0.02em'
                }}>
                    Tribunal de Decisiones IA
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 500 }}>
                    Debate Estructurado: ¿Corregir el tutorial de Stellar BasicPay?
                </p>
            </div>

            {/* Persona Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.75rem', marginBottom: '3.5rem' }}>
                {PERSONAS.map(p => (
                    <div key={p.id} className="glass-card" style={{
                        padding: '1.75rem',
                        textAlign: 'center',
                        borderTop: `4px solid ${p.color}`,
                        boxShadow: `0 10px 30px ${p.color}15`,
                    }}>
                        <div style={{ fontSize: '2.8rem', marginBottom: '1.25rem', filter: `drop-shadow(0 0 10px ${p.color}44)` }}>{p.avatar}</div>
                        <h3 style={{ color: '#fff', margin: '0 0 0.25rem 0', fontFamily: "'Syne', sans-serif", fontSize: '1.1rem' }}>{p.name}</h3>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: p.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                            {p.role}
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{p.bio}</p>
                    </div>
                ))}
            </div>

            {/* Conversation Flow */}
            <div className="glass-card" style={{ padding: '2.5rem', marginBottom: '2.5rem', minHeight: '450px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {DEBATE_CONTENT.slice(0, visibleMessages).map((msg, idx) => {
                    const p = PERSONAS.find(pers => pers.id === msg.personaId)!;
                    const isVerdict = msg.type === 'verdict';

                    return (
                        <div key={msg.id} className="fade-in" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: isVerdict ? 'center' : (msg.personaId === 'mara' ? 'flex-start' : 'flex-end'),
                            width: '100%'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                marginBottom: '0.6rem',
                                flexDirection: msg.personaId === 'mara' ? 'row' : 'row-reverse'
                            }}>
                                <span style={{ fontSize: '1.3rem', filter: `drop-shadow(0 0 5px ${p.color}44)` }}>{p.avatar}</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: p.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{p.name}</span>
                            </div>
                            <div style={{
                                maxWidth: '85%',
                                padding: '1.25rem 1.5rem',
                                borderRadius: isVerdict ? '20px' : (msg.personaId === 'mara' ? '0 20px 20px 20px' : '20px 0 20px 20px'),
                                background: isVerdict ? 'rgba(251, 191, 36, 0.04)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${isVerdict ? 'rgba(251, 191, 36, 0.25)' : 'rgba(255,255,255,0.06)'}`,
                                color: isVerdict ? '#fff' : 'var(--text-primary)',
                                fontStyle: isVerdict ? 'italic' : 'normal',
                                position: 'relative',
                                boxShadow: isVerdict ? '0 0 40px rgba(251, 191, 36, 0.1)' : 'none',
                                lineHeight: '1.6',
                                fontSize: '0.95rem'
                            }}>
                                {isVerdict && <div style={{ fontWeight: 900, color: p.color, marginBottom: '0.75rem', textAlign: 'center', letterSpacing: '0.1em' }}>⚖️ EL VEREDICTO</div>}
                                {msg.text}
                            </div>
                        </div>
                    );
                })}

                {visibleMessages < DEBATE_CONTENT.length && (
                    <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                        <button className="btn-primary" onClick={showNext} style={{ padding: '1rem 2.5rem' }}>
                            {visibleMessages === 0 ? '🎙️ Iniciar Debate' : '⏭️ Siguiente Argumento'}
                        </button>
                    </div>
                )}
            </div>

            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                Este es un simulacro generado por agentes IA para asistir en la toma de decisiones técnicas.
            </div>
        </div>
    );
}
