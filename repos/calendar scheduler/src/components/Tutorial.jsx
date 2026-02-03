import { useState, useEffect, useLayoutEffect, useRef } from 'react'

export function Tutorial({ isOpen, onClose, currentUser, users, setOpen, onStepChange }) {
    const [step, setStep] = useState(0)
    const [mainTourStep, setMainTourStep] = useState(0)
    const [targetRect, setTargetRect] = useState(null)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [bubbleHeight, setBubbleHeight] = useState(0) // Start with 0 or auto to measure
    const bubbleRef = useRef(null)

    // Handle window resizing
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Reset/Save state when switching between tours
    useEffect(() => {
        const isAddUserTour = isOpen === 'add-user'
        if (isOpen === 'add-user') {
            setStep(0)
        } else if (isOpen === true) {
            // "true" means a fresh start from the sidebar button
            setMainTourStep(0)
            setStep(0)
        } else if (isOpen === 'main') {
            // "main" means returning from a sub-tour
            setStep(mainTourStep)
        }
        setTargetRect(null)

        if (onStepChange && isOpen) {
            const currentBaseStep = (isOpen === true) ? 0 : mainTourStep
            onStepChange(isOpen === 'add-user' ? 0 : currentBaseStep, isAddUserTour)
        }
    }, [isOpen])

    const mainTourSteps = [
        {
            title: "Welcome to Scheduler!",
            description: "Find the best time to meet with your friends in real-time.",
            targetId: "sidebar-header",
            position: "right"
        },
        {
            title: currentUser ? "Acting as User" : "Step 1: Create Profile",
            description: "", // Dynamically generated
            targetId: "user-section",
            position: "right"
        },
        {
            title: "Step 2: Pick Your Dates",
            description: "Just click on the calendar! Every click saves instantly. Your friends see your updates in real-time.",
            targetId: "calendar-grid-container",
            position: "top"
        },
        {
            title: "Step 3: Real-time Summary",
            description: "Scroll down to see who else is available. Use filters to find the perfect overlap.",
            targetId: "summary-section",
            position: "right"
        },
        {
            title: "Invite Everyone",
            description: "Click here to copy the unique link. Send it to your group - no logins required!",
            targetId: "copy-link-button",
            position: "right"
        }
    ]

    const addUserSteps = [
        {
            title: "Enter a Name",
            description: "Type the person's name here. It can be a nickname or full name.",
            targetId: "user-name-input",
            position: "right"
        },
        {
            title: "Pick a Brand Color",
            description: "Choose a distinct color. This makes their availability stand out on the calendar.",
            targetId: "user-color-input",
            position: "right"
        },
        {
            title: "Confirm & Add",
            description: "Hit 'Add User' and they'll instantly appear in the switcher above!",
            targetId: "add-user-submit-button",
            position: "right"
        }
    ]

    const isAddUserTour = isOpen === 'add-user'
    const steps = isAddUserTour ? addUserSteps : mainTourSteps
    const currentStep = steps[step] || steps[0]

    useLayoutEffect(() => {
        if (bubbleRef.current) {
            setBubbleHeight(bubbleRef.current.offsetHeight)
        }
    }, [step, currentStep, isMobile, targetRect])

    // ... existing layout effect for targetRect ...
    // Use a layout effect to measure the target element
    useLayoutEffect(() => {
        if (!isOpen || !currentStep) return

        let animationFrameId

        const updateTarget = () => {
            const el = document.getElementById(currentStep.targetId)
            if (el) {
                const rect = el.getBoundingClientRect()
                setTargetRect(prev => {
                    if (!prev ||
                        prev.top !== rect.top ||
                        prev.left !== rect.left ||
                        prev.width !== rect.width ||
                        prev.height !== rect.height) {
                        return rect
                    }
                    return prev
                })
            }
            // Also update bubble height if it changes due to content reflow
            if (bubbleRef.current && bubbleRef.current.offsetHeight !== bubbleHeight) {
                setBubbleHeight(bubbleRef.current.offsetHeight)
            }
            animationFrameId = requestAnimationFrame(updateTarget)
        }

        updateTarget()
        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId)
        }
    }, [step, isOpen, currentStep, bubbleHeight]) // Added bubbleHeight dependency slightly risky loop? No, check only updates if diff.

    if (!isOpen || !currentStep) return null

    // ... handlers ...

    const handleNext = () => {
        const isAddUserTour = isOpen === 'add-user'
        if (step < steps.length - 1) {
            const nextStep = step + 1
            setStep(nextStep)
            if (!isAddUserTour) {
                setMainTourStep(nextStep)
                if (onStepChange) onStepChange(nextStep, false)
            } else {
                if (onStepChange) onStepChange(nextStep, true)
            }
        } else {
            if (isAddUserTour) {
                setMainTourStep(2)
                setOpen('main')
                if (onStepChange) onStepChange(2, false)
            } else {
                setMainTourStep(0)
                onClose()
            }
        }
    }

    const handleBack = () => {
        const isAddUserTour = isOpen === 'add-user'
        if (step > 0) {
            const prevStep = step - 1
            setStep(prevStep)
            if (!isAddUserTour) {
                setMainTourStep(prevStep)
                if (onStepChange) onStepChange(prevStep, false)
            } else {
                if (onStepChange) onStepChange(prevStep, true)
            }
        }
    }

    const activeUser = users.find(u => u.id === currentUser)
    const padding = 12
    const r = 16 // borderRadius
    const rect = targetRect || { top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0 }

    const x = rect.left - padding
    const y = rect.top - padding
    const w = rect.width + padding * 2
    const h = rect.height + padding * 2

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
            <svg className="fixed inset-0 w-full h-full pointer-events-auto">
                <defs>
                    <mask id="tutorial-mask">
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        {targetRect && (
                            <rect
                                x={x}
                                y={y}
                                width={w}
                                height={h}
                                rx={r}
                                ry={r}
                                fill="black"
                                className="transition-all duration-300 ease-in-out"
                            />
                        )}
                    </mask>
                </defs>
                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(0,0,0,0.75)"
                    mask="url(#tutorial-mask)"
                    className="transition-all duration-300"
                />
            </svg>

            {targetRect && (
                <div
                    className="fixed z-[105] border-[3px] border-red-500 rounded-xl shadow-[0_0_40px_rgba(239,68,68,0.3)] transition-all duration-300 pointer-events-none"
                    style={{
                        top: y,
                        left: x,
                        width: w,
                        height: h,
                    }}
                />
            )}

            {targetRect && (
                <div
                    ref={bubbleRef}
                    className="fixed z-[120] animate-in fade-in zoom-in duration-300 pointer-events-auto"
                    style={{
                        ...getBubblePosition(rect, currentStep.position, isMobile, padding, bubbleHeight)
                    }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 relative border-2 border-indigo-50 max-h-[80vh] overflow-y-auto no-scrollbar">
                        <div className={`absolute border-8 border-transparent ${getArrowClass(currentStep.position, isMobile)}`} />

                        <div className="flex justify-between items-start mb-3">
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                                {isAddUserTour ? `Guide Step ${step + 1}/${steps.length}` : (step === 0 ? "Introduction" : `Step ${step} of ${steps.length - 1}`)}
                            </span>
                            <button onClick={() => onClose()} className="text-gray-300 hover:text-gray-500 transition-colors text-xl leading-none">&times;</button>
                        </div>

                        <h3 className="text-xl font-black text-gray-800 mb-2 leading-tight">
                            {currentStep.title}
                        </h3>
                        {/* ... content ... */}
                        <div className="text-gray-500 text-sm mb-8 leading-relaxed">
                            {isAddUserTour ? currentStep.description : (
                                step === 1 ? (
                                    <div className="space-y-4">
                                        <p>
                                            {currentUser
                                                ? `You are currently acting as ${activeUser?.name || 'a user'}. All dates you click will be saved under your name.`
                                                : "Enter your name and pick a color to start marking your availability."
                                            }
                                        </p>
                                        <button
                                            onClick={() => {
                                                setMainTourStep(1)
                                                setOpen('add-user')
                                            }}
                                            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100 group shadow-sm text-xs"
                                        >
                                            <svg className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                                            <span>How do I add a user?</span>
                                        </button>
                                    </div>
                                ) : currentStep.description
                            )}
                        </div>

                        <div className="flex gap-2">
                            {step > 0 && (
                                <button
                                    onClick={handleBack}
                                    className="px-4 py-2.5 rounded-xl border border-gray-100 text-gray-400 font-bold text-xs hover:bg-gray-50 transition-all"
                                >
                                    Back
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
                            >
                                {step === steps.length - 1 ? (isAddUserTour ? "Finish Guide" : "Got it!") : "Next Step"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function getBubblePosition(rect, position, isMobile, padding, measuredHeight) {
    const margin = 28
    const bubbleWidth = 320
    const bubbleHeight = measuredHeight || 300 // Use measured or default to safer larger

    let pos = {}

    if (isMobile) {
        if (rect.top > 300) {
            pos = { bottom: window.innerHeight - rect.top + margin + padding, left: (window.innerWidth - bubbleWidth) / 2 }
        } else {
            pos = { top: rect.bottom + margin + padding, left: (window.innerWidth - bubbleWidth) / 2 }
        }
    } else {
        switch (position) {
            case 'right':
                pos = { top: rect.top - padding, left: rect.right + margin + padding }
                break
            case 'left':
                pos = { top: rect.top - padding, left: rect.left - bubbleWidth - margin - padding }
                break
            case 'bottom':
                pos = { top: rect.bottom + margin + padding, left: rect.left + (rect.width / 2) - (bubbleWidth / 2) }
                break
            case 'top':
                pos = { bottom: window.innerHeight - rect.top + margin + padding, left: rect.left + (rect.width / 2) - (bubbleWidth / 2) }
                break
            default:
                pos = { top: rect.top - padding, left: rect.right + margin + padding }
        }
    }

    // Strict clamping to viewport
    // Convert bottom-aligned to top-aligned for bounding check if needed, or check bounds directly

    // 1. Calculate prospective top/bottom
    let top = pos.top
    let bottom = pos.bottom // this is distance from bottom

    if (top !== undefined) {
        // Clamp top
        top = Math.max(10, top)
        // Check overflow bottom
        if (top + bubbleHeight > window.innerHeight - 10) {
            // Shift up
            top = Math.max(10, window.innerHeight - bubbleHeight - 10)
        }
        pos.top = top
    }

    // If positioned by 'bottom'
    if (bottom !== undefined) {
        // Clamp "bottom" (distance from bottom) so it doesn't go off top
        // bottom + height > windowHeight => clipped at top
        if (bottom + bubbleHeight > window.innerHeight - 10) {
            // Shift down (reduce distance from bottom)
            bottom = Math.max(10, window.innerHeight - bubbleHeight - 10)
        }
        bottom = Math.max(10, bottom)
        pos.bottom = bottom
    }

    if (pos.left !== undefined) {
        pos.left = Math.max(10, Math.min(pos.left, window.innerWidth - bubbleWidth - 10))
    }

    return pos
}

function getArrowClass(position, isMobile) {
    if (isMobile) return "hidden"

    switch (position) {
        case 'right':
            return "border-r-white -left-4 top-6"
        case 'left':
            return "border-l-white -right-4 top-6"
        case 'bottom':
            return "border-b-white -top-4 left-1/2 -ml-2"
        case 'top':
            return "border-t-white -bottom-4 left-1/2 -ml-2"
        default:
            return ""
    }
}
