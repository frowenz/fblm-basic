class HSLMatcher extends HTMLElement {
    // target-h: target hue
    // target-s: target saturation
    static get observedAttributes() {
        return ['source-color', 'target-h', 'target-s', 'target-l', 'svg-name', 'handler'];
    }

    constructor() {
        super();
        this._shadowRoot = this.attachShadow({ 'mode': 'open' });

        // Loading in the html and css
        this.templatePromise = Promise.all([
            fetch('luminance-component/hsl-matcher.html').then(response => response.text()),
            fetch('luminance-component/hsl-matcher.css').then(response => response.text())
        ])
            .then(([html, css]) => {
                this._shadowRoot.innerHTML = html;
                const style = document.createElement('style');
                style.textContent = css;
                this._shadowRoot.appendChild(style);
            })
            .catch(console.error);

        this.currentLightness = 50;  // initial lightness is in the middle

        // Random default values that get overwritten if the user specifies them
        this.sourceColor = "hsl(0, 0%, 35%)"
        this.targetHue = "90"
        this.targetSaturation = "90"
        this.targetLightness = "50"
        this.svgName = "shss"
        this.target = null
        this.source = null
        this.handler = null
        this.slider = this._shadowRoot.querySelector('#slider');
    }

    updateLightness(lightnessValue) {
        this.currentLightness = lightnessValue;
        if (this.target) {
            this.target.setAttribute('fill', `hsl(${this.targetHue}, ${this.targetSaturation}%, ${this.currentLightness}%)`);
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'source-color':
                this.sourceColor = newValue;
                if (this.source) {
                    this.source.setAttribute('fill', this.sourceColor);
                }
                break;
            case 'target-h':
                this.targetHue = parseFloat(newValue);
                if (this.target) {
                    this.target.setAttribute('fill', `hsl(${this.targetHue}, ${this.targetSaturation}%, ${this.targetLightness}%)`);
                }
                break;
            case 'target-s':
                this.targetSaturation = parseFloat(newValue);
                if (this.target) {
                    this.target.setAttribute('fill', `hsl(${this.targetHue}, ${this.targetSaturation}%, ${this.targetLightness}%)`);
                }
                break;
            case 'target-l':
                this.targetLightness = parseFloat(newValue);
                this.currentLightness = this.targetLightness;
                if (this.target) {
                    this.target.setAttribute('fill', `hsl(${this.targetHue}, ${this.targetSaturation}%, ${this.targetLightness}%)`);
                }
                break;
            case 'svg-name':
                this.svgName = newValue;
                const svgObject = this._shadowRoot.querySelector('#svg-obj');
                if (svgObject) {
                    svgObject.setAttribute('data', `luminance-component/face-${this.svgName}.svg`);
                }
                break;
            case 'handler':
                this.handler = 'handler'
                break;
        }
    }


    async connectedCallback() {
        await this.templatePromise;
        // wait for html and css to be loaded in

        const svgContainer = this._shadowRoot.querySelector('#svg-container');
        const svgObject = this._shadowRoot.querySelector('#svg-obj');
        svgObject.setAttribute('data', `luminance-component/face-${this.svgName}.svg`);

        let isDragging = false;
        let startMouseX = 0;

        svgObject.addEventListener('load', () => {
            const svgDocument = svgObject.contentDocument;

            // Randomizes which side is the source / target
            if (Math.random() > 0.5) {
                this.source = svgDocument.querySelector('#fblmForeground');
                this.target = svgDocument.querySelector('#fblmBackground');
            }
            else {
                this.source = svgDocument.querySelector('#fblmBackground');
                this.target = svgDocument.querySelector('#fblmForeground');
            }
            this.source.setAttribute('fill', this.sourceColor);
            this.target.setAttribute('fill', `hsl(${this.targetHue}, ${this.targetSaturation}%, ${this.currentLightness}%)`);
        });

        svgContainer.addEventListener('mousedown', (event) => {
            isDragging = true;
            startMouseX = event.clientX;
        });

        document.addEventListener('mousemove', (event) => {
            if (!isDragging) return;

            const deltaX = event.clientX - startMouseX;
            const newLightnessValue = Math.min(Math.max(this.currentLightness + deltaX / svgContainer.offsetWidth * 50, 0), 100);

            if (this.target) {
                this.target.setAttribute('fill', `hsl(${this.targetHue}, ${this.targetSaturation}%, ${newLightnessValue}%)`);
                this.currentLightness = newLightnessValue;

                // Dispatch a custom event with the new lightness value
                const lightnessEvent = new CustomEvent('lightnessChange', {
                    detail: {
                        hue: this.targetHue,
                        saturation: this.targetSaturation,
                        lightness: this.currentLightness
                    },
                    bubbles: true,
                    composed: true,
                });
                this.dispatchEvent(lightnessEvent);
            }

            startMouseX = event.clientX;
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                const matchEvent = new CustomEvent('matchEvent', {
                    detail: { lightness: this.currentLightness },
                    bubbles: true,
                    composed: true,
                });
                this.dispatchEvent(matchEvent);
            }
        });


        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        this.addEventListener('sliderChange', (event) => {
            this.updateLightness(event.detail.value);
        });
    }
}

window.customElements.define('hsl-matcher', HSLMatcher);


class HSLMatcherUI extends HTMLElement {
    static get observedAttributes() {
        return ['unmatched-pairs'];
    }

    constructor() {
        super();
        this._shadowRoot = this.attachShadow({ 'mode': 'open' });

        // Loading in the html and css
        this.templatePromise = Promise.all([
            fetch('luminance-component/hsl-matcher-ui.html').then(response => response.text()),
            fetch('luminance-component/hsl-matcher-ui.css').then(response => response.text())
        ])
            .then(([html, css]) => {
                this._shadowRoot.innerHTML = html;
                const style = document.createElement('style');
                style.textContent = css;
                this._shadowRoot.appendChild(style);
            })
            .catch(console.error);

        this.matched_pairs = []
        this.unmatched_pairs = []
        this.currentPairIndex = 0;
        this.has_begun = false;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'unmatched-pairs') {
            try {
                this.unmatched_pairs = JSON.parse(newValue.replace(/'/g, '"'));
            } catch (e) {
                console.error('Error parsing pairs:', e);
            }
        }
    }

    async connectedCallback() {
        await this.templatePromise;

        const slider = this._shadowRoot.querySelector('#slider');
        slider.disabled = true;

        slider.addEventListener('input', (event) => {
            const sliderEvent = new CustomEvent('sliderChange', {
                detail: { value: event.target.value / 10 },
                bubbles: true,
                composed: true,
            });
            this._shadowRoot.querySelector('hsl-matcher').dispatchEvent(sliderEvent);
        });


        // Listen for the lightnessChange event
        this._shadowRoot.querySelector('hsl-matcher').addEventListener('lightnessChange', (event) => {
            // Update the slider value
            slider.value = event.detail.lightness * 10; // Assuming your slider is scaled from 0-1000
        });


        const begin = this._shadowRoot.querySelector('#begin');
        begin.addEventListener('click', () => {
            const instructions = this._shadowRoot.querySelector('#instructions');
            instructions.style.display = 'none';
            this.startMatching();
            slider.disabled = false;
        })

        this.addEventListener('matchEvent', (event) => {
            // Record the matched lightness and the final colors for the current pair
            const matchedPair = {
                source: this.unmatched_pairs[this.currentPairIndex]["source"],
                target: `hsl(${this._shadowRoot.querySelector('hsl-matcher').targetHue}, ${this._shadowRoot.querySelector('hsl-matcher').targetSaturation}%, ${event.detail.lightness}%)`
            };
            this.matched_pairs.push(matchedPair);

            // Move to the next pair
            this.currentPairIndex++;
            if (this.currentPairIndex < this.unmatched_pairs.length) {
                this.setPair(this.unmatched_pairs[this.currentPairIndex]);
            } else {
                console.log('All pairs have been matched', this.matched_pairs);
                const completed = this._shadowRoot.querySelector('#completed');
                completed.style.display = 'unset';
                slider.disabled = true;
                const event = new CustomEvent('all-hsl-pairs-matched', { detail: this.matched_pairs });
                document.dispatchEvent(event);
            }
        });

    }

    startMatching() {
        this.currentPairIndex = 0;
        if (this.unmatched_pairs.length > 0) {
            this.setPair(this.unmatched_pairs[0]);
        }
    }

    setPair(pair) {
        const matcher = this._shadowRoot.querySelector('hsl-matcher');
        matcher.setAttribute('source-color', pair.source);
        matcher.setAttribute('target-h', pair.target.hue);
        matcher.setAttribute('target-s', pair.target.saturation);
    }
}
window.customElements.define('hsl-matcher-ui', HSLMatcherUI);