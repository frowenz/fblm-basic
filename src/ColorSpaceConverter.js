import React, { useState, useEffect } from 'react';
import * as d3 from 'd3-color';

function clamp(val, min, max) {
    if (isNaN(val)) { return 0; }
    return val < min ? min : (val > max ? max : val);
}

const ColorSpaceConverter = ({ name, colorHSL, setColorHSL }) => {
    const [theColor, setTheColor] = useState(d3.rgb(colorHSL));
    const [theSpace, setTheSpace] = useState('RGB');
    const [values, setValues] = useState({ 'R': theColor.r, 'G': theColor.g, 'B': theColor.b });
    const [warning, setWarning] = useState(' ');

    useEffect(() => {
        const { r, g, b } = theColor;
        const [parsedR, parsedG, parsedB] = [r, g, b].map(value => parseFloat(value).toFixed(2));

        if (parsedR > 255 || parsedG > 255 || parsedB > 255) {
            setWarning(`RGB Value: ${parsedR}, ${parsedG}, ${parsedB} is out of range`);
        } else {
            setWarning('.');
        }

        setColorHSL(d3.hsl(d3.rgb(clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255))));
    }, [theColor]);

    useEffect(() => {
        switch (theSpace) {
            case 'RGB':
                setTheColor(d3.rgb(values.R, values.G, values.B));
                break;
            case 'HSL':
                setTheColor(d3.rgb(d3.hsl(values.H, values.S, values.L)));
                break;
            default:
                setTheColor(d3.rgb(d3.hcl(values.H, values.C, values.L)));
        }
    }, [values, theSpace]);

    const handleSliderChange = (key, event) => {
        const newValue = parseFloat(event.target.value);
        if (newValue !== values[key]) {
            setValues(prev => ({ ...prev, [key]: newValue }));
        }
    };

    const handleInputChange = (key, event) => {
        const newValue = parseFloat(event.target.value);
        if (!isNaN(newValue) && newValue !== values[key]) {
            setValues(prev => ({ ...prev, [key]: newValue }));
        }
    };

    const handleColorSpaceChange = (space) => {
        if (theSpace === space) return;

        let newColor = d3.rgb(theColor)
        newColor.r = clamp(newColor.r, 0, 255)
        newColor.g = clamp(newColor.g, 0, 255)
        newColor.b = clamp(newColor.b, 0, 255)

        if (space === 'RGB') {
            setValues({ 'R': newColor.r, 'G': newColor.g, 'B': newColor.b });
        } else if (space === 'HSL') {
            newColor = d3.hsl(newColor)
            setValues({ 'H': newColor.h, 'S': newColor.s, 'L': newColor.l });
        } else {
            newColor = d3.hcl(newColor)
            setValues({ 'H': newColor.h, 'C': newColor.c, 'L': newColor.l });
        }

        setTheSpace(space);
    };

    const handleSwatchChange = (e) => {
        const newColor = d3.rgb(e.target.value);
        if (theSpace === 'RGB') {
            setValues({ 'R': newColor.r, 'G': newColor.g, 'B': newColor.b });
        }
        else if (theSpace === 'HSL') {
            const hsl = d3.hsl(newColor);
            setValues({ 'H': hsl.h, 'S': hsl.s, 'L': hsl.l });
        }
        else {
            const hcl = d3.hcl(newColor);
            setValues({ 'H': hcl.h, 'C': hcl.c, 'L': hcl.l });
        }
    }

    const colorSpaces = ['RGB', 'HSL', 'HCL'];
    const maxLookUp = { 'H': 360, 'S': 1, 'L': 1, 'R': 255, 'G': 255, 'B': 255, 'C': 134 };

    return (
        <div className="csconverter p-5 w-fit">
            <div className='flex justify-between'>
                <div>
                    <div className='flex items-center'>
                        <h2 className="text-xl font-bold mb-2 w-fit">{name}&ensp;</h2>
                    </div>
                    <div className="flex space-x-2 mb-2 w-fit">
                        {colorSpaces.map((cs) => (
                            <button
                                key={cs}
                                className={`px-2 py-1 rounded ${theSpace === cs ? 'bg-neutral-500 text-white' : 'bg-gray-200'}`}
                                onClick={() => handleColorSpaceChange(cs)}
                            >
                                {cs}
                            </button>
                        ))}
                    </div>
                </div>
                <input type="color"
                    className="color-swatch"
                    value={theColor.hex()}
                    onChange={(e) => handleSwatchChange(e)}
                />
            </div>
            {Object.entries(values).map(([key, value]) => (
                <div key={key} className="flex items-center justify-center space-x-2 my-2">
                    <input
                        type="range"
                        min="0"
                        max={(key === 'L' && theSpace === 'HCL') ? 100 : maxLookUp[key]}
                        value={value}
                        step={key === 'H' ? 1 : 0.01}
                        onChange={(e) => handleSliderChange(key, e)}
                        className="slider w-64"
                    />
                    <input
                        type="number"
                        min="0"
                        max={(key === 'L' && theSpace === 'HCL') ? 100 : maxLookUp[key]}
                        value={(key === 'H' || theSpace === 'RGB') ? parseFloat(value).toFixed(0) : parseFloat(value).toFixed(2)}
                        step={key === 'H' ? 1 : 0.01}
                        onChange={(e) => handleInputChange(key, e)}
                        className="w-20 text-center"
                    />
                    <label>{key.toUpperCase()}</label>
                </div>
            ))}
            {warning && <div className="text-red-500 text-sm mt-2">{warning}</div>}
        </div>
    );
};

export default ColorSpaceConverter;