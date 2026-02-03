import { useState } from 'react'

export function Tutorial({ isOpen, onClose }) {
    const [step, setStep] = useState(0)

    const steps = [
        {
            title: "Welcome to Calendar Scheduler!",
            description: "This tool helps you and your friends find the best time to meet. It's simple, fast, and real-time.",
            image: "/camera-scheduler/tutorial/step1.png"
        },
        {
            title: "Step 1: Add Yourself",
            description: "Type your name in the sidebar and pick a color. This helps everyone identify your availability.",
            image: "/camera-scheduler/tutorial/step2.png"
        },
        {
            title: "Step 2: Pick Your Dates",
            description: "Click on the calendar dates when you're available. Click again to remove. Everything saves automatically!",
            image: "/camera-scheduler/tutorial/step3.png"
        },
        {
            title: "Step 3: Check the Summary",
            description: "See who else is available. The summary updates in real-time as your friends add their dates.",
            image: "/camera-scheduler/tutorial/step4.png"
        },
        {
            title: "Step 4: Share the Link",
            description: "Copy the unique event link and send it to your friends. They don't even need an account!",
            image: "/camera-scheduler/tutorial/step5.png"
        }
    ]

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1)
        } else {
            onClose()
        }
    }

    const handlePrev = () => {
        if (step > 0) {
            setStep(step - 1)
        }
    }

    if (!isOpen) return null

    const currentStep = steps[step]

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
                {/* Visual Area */}
                <div className="md:w-1/2 bg-indigo-50 flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-gray-100">
                    <div className="relative w-full aspect-video md:aspect-square overflow-hidden rounded-2xl shadow-lg border-4 border-white bg-gray-100">
                        <img
                            src={currentStep.image}
                            alt={currentStep.title}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </div>
                </div>

                {/* Content Area */}
                <div className="md:w-1/2 p-8 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-6">
                            <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                                Step {step + 1} of {steps.length}
                            </span>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-50 rounded-lg"
                                aria-label="Close"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <h3 className="text-2xl font-black text-gray-800 mb-4 tracking-tight leading-tight">
                            {currentStep.title}
                        </h3>
                        <p className="text-gray-500 text-sm leading-relaxed mb-8">
                            {currentStep.description}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 mt-auto">
                        {step > 0 && (
                            <button
                                onClick={handlePrev}
                                className="px-6 py-3 rounded-xl border-2 border-gray-100 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-all"
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-xl shadow-indigo-100 hover:shadow-indigo-200 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                        >
                            {step === steps.length - 1 ? "Finish Tutorial" : "Next Step"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
