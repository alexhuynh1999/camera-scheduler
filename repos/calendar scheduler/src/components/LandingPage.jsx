import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../firebase'
import { doc, setDoc } from 'firebase/firestore'
import { Toast } from './Common/Toast'

export function LandingPage() {
    const navigate = useNavigate()
    const [eventName, setEventName] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [toast, setToast] = useState(null)

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        const array = new Uint32Array(6)
        window.crypto.getRandomValues(array)
        let result = ''
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(array[i] % chars.length)
        }
        return result
    }

    const handleCreateEvent = async (e) => {
        e.preventDefault()
        if (!eventName.trim()) return

        setIsCreating(true)
        const code = generateCode()
        try {
            await setDoc(doc(db, 'events', code), {
                name: eventName.trim(),
                createdAt: new Date().toISOString(),
                lastAccessedAt: new Date().toISOString(),
                version: '1.4.0'
            })
            navigate(`/${code}`)
        } catch (e) {
            console.error("Error creating event:", e)
            setToast({ message: "Failed to create event. Please try again.", type: 'error' })
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <div className="max-w-md w-full text-center space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100 transition-all hover:shadow-2xl relative">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                        Scheduler
                    </h1>
                    <p className="text-gray-500 font-medium">
                        Create a private schedule and invite others to help coordinate.
                    </p>
                </div>

                <form onSubmit={handleCreateEvent} className="space-y-4">
                    <div className="relative group">
                        <input
                            type="text"
                            value={eventName}
                            onChange={(e) => setEventName(e.target.value)}
                            placeholder="What's this event for?"
                            className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-center font-bold text-gray-700 placeholder:text-gray-300 placeholder:font-medium"
                            required
                        />
                        <div className="absolute inset-0 rounded-xl border-2 border-transparent group-focus-within:border-indigo-500/20 pointer-events-none transition-all" />
                    </div>

                    <button
                        type="submit"
                        disabled={!eventName.trim() || isCreating}
                        className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {isCreating ? (
                            <div className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Generating...</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <svg className="h-5 w-5 text-indigo-300 group-hover:text-indigo-200 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                </svg>
                                <span>Create My Event</span>
                            </div>
                        )}
                    </button>
                </form>

                <div className="flex flex-col items-center gap-3 pt-4">
                    <div className="text-xs text-gray-400 font-medium">
                        No sign-up required. Just create and share the link.
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-gray-50 text-[10px] font-bold text-gray-300 border border-gray-100">v1.3.0</span>
                </div>
            </div>
        </div>
    )
}
