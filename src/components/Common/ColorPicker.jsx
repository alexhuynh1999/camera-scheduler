import { useState, useEffect, useRef } from 'react';

// --- Helpers ---

// Convert Hex to HSL
const hexToHSL = (hex) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = "0x" + hex[1] + hex[1];
        g = "0x" + hex[2] + hex[2];
        b = "0x" + hex[3] + hex[3];
    } else if (hex.length === 7) {
        r = "0x" + hex[1] + hex[2];
        g = "0x" + hex[3] + hex[4];
        b = "0x" + hex[5] + hex[6];
    }
    r /= 255;
    g /= 255;
    b /= 255;
    let cmin = Math.min(r, g, b),
        cmax = Math.max(r, g, b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;

    if (delta === 0) h = 0;
    else if (cmax === r) h = ((g - b) / delta) % 6;
    else if (cmax === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h = Math.round(h * 60);

    if (h < 0) h += 360;

    l = (cmax + cmin) / 2;
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return { h, s, l };
};

// Convert HSL to Hex
const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;

    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs(((h / 60) % 2) - 1)),
        m = l - c / 2,
        r = 0,
        g = 0,
        b = 0;

    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }

    r = Math.round((r + m) * 255).toString(16);
    g = Math.round((g + m) * 255).toString(16);
    b = Math.round((b + m) * 255).toString(16);

    if (r.length === 1) r = "0" + r;
    if (g.length === 1) g = "0" + g;
    if (b.length === 1) b = "0" + b;

    return "#" + r + g + b;
};

// --- Constants ---
const DEFAULT_COLORS = [
    '#EF4444', // red-500
    '#F97316', // orange-500
    '#EAB308', // yellow-500
    '#22C55E', // green-500
    '#3B82F6', // blue-500
    '#6366F1', // indigo-500
    '#A855F7', // purple-500
    '#EC4899', // pink-500
];

export function ColorPicker({ color, onChange, id }) {
    const [isOpen, setIsOpen] = useState(false);
    const [hsl, setHsl] = useState({ h: 0, s: 100, l: 50 });
    const [hexInput, setHexInput] = useState(color);
    const popoverRef = useRef(null);

    // Sync internal state when `color` prop changes from outside
    useEffect(() => {
        setHsl(hexToHSL(color));
        setHexInput(color);
    }, [color]);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleHslChange = (key, value) => {
        const newHsl = { ...hsl, [key]: Number(value) };
        setHsl(newHsl);
        onChange(hslToHex(newHsl.h, newHsl.s, newHsl.l));
    };

    const handlePresetClick = (hex) => {
        onChange(hex);
        // We don't necessarily close it, maybe they want to tweak it? 
        // Let's keep it open for now or we can close it. 
        // The user requirement says "menu", usually that implies selection = close for presets, 
        // but for continuous editing (sliders) it stays open.
        // Let's close on preset click for convenience.
        // Actually, let's keep it open to let them tweak the preset.
    };

    return (
        <div className="relative" ref={popoverRef}>
            {/* Preview Button */}
            <button
                id={id}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-10 h-10 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:scale-105 transition-transform"
                style={{ backgroundColor: color }}
                aria-label="Pick color"
            />

            {/* Popover */}
            {isOpen && (
                <div className="absolute z-50 mt-2 p-4 bg-white rounded-xl shadow-xl border border-gray-100 w-64 animate-in fade-in zoom-in-95 duration-200"
                    style={{ left: '0', top: '100%' }} // Simple positioning
                >
                    {/* Presets */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                        {DEFAULT_COLORS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                className={`w-8 h-8 rounded-full border border-gray-100 hover:scale-110 transition-transform ${color.toLowerCase() === c.toLowerCase() ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                                style={{ backgroundColor: c }}
                                onClick={() => handlePresetClick(c)}
                            />
                        ))}
                    </div>

                    <hr className="border-gray-100 my-4" />

                    {/* Hex Input */}
                    <div className="mb-4">
                        <div className="text-xs text-gray-500 mb-1">Hex Code</div>
                        <div className="relative">
                            <input
                                type="text"
                                value={hexInput.toUpperCase()}
                                onChange={(e) => {
                                    const val = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
                                    if (/^#?[0-9A-Fa-f]{0,6}$/.test(val)) {
                                        setHexInput(val);
                                        if (val.length === 4 || val.length === 7) {
                                            onChange(val);
                                        }
                                    }
                                }}
                                onBlur={() => {
                                    // Reset to actual color if invalid on blur
                                    if (hexInput.length !== 4 && hexInput.length !== 7) {
                                        setHexInput(color);
                                    }
                                }}
                                className="w-full px-2 py-1 text-sm bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                                placeholder="#000000"
                            />
                        </div>
                    </div>

                    <hr className="border-gray-100 my-4" />

                    {/* HSL Sliders */}
                    <div className="space-y-3">
                        {/* Hue */}
                        <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Hue</span>
                                <span>{hsl.h}°</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="360"
                                value={hsl.h}
                                onChange={(e) => handleHslChange('h', e.target.value)}
                                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                                style={{
                                    background: `linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)`
                                }}
                            />
                        </div>

                        {/* Saturation */}
                        <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Saturation</span>
                                <span>{hsl.s}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={hsl.s}
                                onChange={(e) => handleHslChange('s', e.target.value)}
                                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                                style={{
                                    background: `linear-gradient(to right, #808080, ${hslToHex(hsl.h, 100, 50)})`
                                }}
                            />
                        </div>

                        {/* Lightness */}
                        <div>
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Lightness</span>
                                <span>{hsl.l}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={hsl.l}
                                onChange={(e) => handleHslChange('l', e.target.value)}
                                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200"
                                style={{
                                    background: `linear-gradient(to right, #000000, ${hslToHex(hsl.h, hsl.s, 50)}, #ffffff)`
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Add some custom styles for range inputs if needed, or rely on Tailwind.
// Note: Standard input[type=range] styling is tricky cross-browser but the gradient background helps.
