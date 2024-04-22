import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import './hsl-matching.js';
import ColorSpaceConverter from './ColorSpaceConverter.js';
import { hsl as d3Hsl } from 'd3-color';

const HSLMatcher = ({ svgName, sourceColor, targetH, targetS, targetL, onLightnessChange }) => {
  const hslMatcherRef = useRef(null);

  useEffect(() => {
    const hslMatcher = document.createElement('hsl-matcher');
    hslMatcherRef.current.appendChild(hslMatcher);

    const handleLightnessChange = event => {
      onLightnessChange(event.detail.lightness);
    };

    hslMatcher.addEventListener('lightnessChange', handleLightnessChange);
    let hslMatcherRefCopy = hslMatcherRef.current;

    return () => {
      hslMatcher.removeEventListener('lightnessChange', handleLightnessChange);
      hslMatcherRefCopy.removeChild(hslMatcher);
    };
  }, []);

  useEffect(() => {
    const hslMatcher = hslMatcherRef.current.querySelector('hsl-matcher');
    if (!hslMatcher) return;

    hslMatcher.setAttribute('source-color', sourceColor);
    hslMatcher.setAttribute('target-h', targetH);
    hslMatcher.setAttribute('target-s', targetS);
    hslMatcher.setAttribute('target-l', targetL);
  }, [sourceColor, targetH, targetS, targetL]);

  useEffect(() => {
    const hslMatcher = hslMatcherRef.current.querySelector('hsl-matcher');
    if (!hslMatcher) return;

    hslMatcher.setAttribute('svg-name', svgName);
  }, [svgName]);


  return <div ref={hslMatcherRef}></div>;
};


function App() {
  const [sliderValue, setSliderValue] = useState(500);
  const [lightnessValue, setLightnessValue] = useState(50);
  const [sourceColor, setSourceColor] = useState(d3Hsl(Math.random() * 360, Math.random(), Math.random()))
  const [svgName, setSVGName] = useState('shss');

  const targetH = 0;
  const targetS = 0;

  const updateLightness = (lightness) => {
    setSliderValue(lightness * 10);
    setLightnessValue(lightness);
  }

  return (
    <div className="App">
      <div className='control-panel'>
        <ColorSpaceConverter name={"Color"} colorHSL={sourceColor} setColorHSL={setSourceColor} />

        <div className='p-5'>
          <h2 className="text-xl font-bold mb-2 w-fit">{"Grey"}</h2>
          <div className="flex items-center justify-center space-x-2 my-2">
            <input
              type="range"
              min="0"
              max={1000}
              value={sliderValue}
              onChange={(e) => updateLightness(e.target.value / 10)}
              className="slider w-64"
              style={{ accentColor: 'gainsboro' }}
            />
            <input
              type="number"
              value={parseFloat(sliderValue / 10).toFixed(2)}
              onChange={(e) => updateLightness(e.target.value)}
              className="w-20 text-center"
              style={{ accentColor: 'gainsboro' }}
            />
          </div>
          <div />
        </div>

        {/* Removed for Simplicity */}
        {/* <div className='p-5'>
          <h2 className="text-xl font-bold mb-2 w-fit">{"SVG"}</h2>
          <div className="flex space-x-2 mb-2 w-fit">
            {['shss', 'shar', 'mell', 'wedd', 'sdog'].map((face) => (
              <button
                key={face}
                className={`px-2 py-1 rounded ${svgName === face ? 'bg-neutral-500 text-white' : 'bg-gray-200'}`}
                onClick={() => setSVGName(face)}
              >
                {face}
              </button>
            ))}
          </div>
        </div> */}

      </div>
      <div className="meta-container">
        <div id='hsl-matcher-container'>
          <HSLMatcher
            svgName={svgName}
            sourceColor={`hsl(${sourceColor.h}, ${sourceColor.s * 100}%, ${sourceColor.l * 100}%)`}
            targetH={targetH}
            targetS={targetS}
            targetL={lightnessValue}
            onLightnessChange={updateLightness}
          />
        </div>
      </div>
    </div >
  );
}

export default App;
