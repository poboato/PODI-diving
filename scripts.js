// PODI - Professional Organization of Dangerously Incompetent Divers
// All scripts are as unreliable as our instructors.

(function() {
    "use strict";

    // ============================================================
    // 1. DIVE COMPUTER WIDGET
    // ============================================================
    var diveComputer = {
        depth: 0,
        airPressure: 3000,
        ndl: 99,
        temp: 27,
        decoWarning: false,
        lowAirWarning: false,
        running: false,
        interval: null,

        init: function() {
            this.createWidget();
            this.running = true;
            var self = this;

            window.addEventListener('scroll', function() {
                if (!self.running) return;
                var scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
                if (scrollPercent < 0) scrollPercent = 0;
                if (scrollPercent > 1) scrollPercent = 1;
                self.depth = Math.round(scrollPercent * 68);
                self.updateDisplay();
            });

            this.interval = setInterval(function() {
                if (!self.running) return;
                var drop = Math.round(Math.random() * 80 + 20);
                self.airPressure -= drop;
                if (Math.random() < 0.08) {
                    self.airPressure += Math.round(Math.random() * 400 + 200);
                }
                if (self.airPressure > 3500) self.airPressure = 3500;
                if (self.airPressure < 0) self.airPressure = 0;

                self.ndl -= Math.round(Math.random() * 2);
                if (Math.random() < 0.05) self.ndl += Math.round(Math.random() * 10);
                if (self.ndl > 99) self.ndl = 99;

                self.temp += Math.round((Math.random() * 6 - 3) * 10) / 10;
                if (self.temp > 35) self.temp = 35;
                if (self.temp < 10) self.temp = 10;

                self.decoWarning = Math.random() < 0.3;
                self.lowAirWarning = self.airPressure < 500 || Math.random() < 0.1;

                self.updateDisplay();
            }, 2000);

            setTimeout(function() {
                self.showMalfunction();
            }, 15000);

            setTimeout(function() {
                self.flashError();
            }, 30000);
        },

        createWidget: function() {
            var widget = document.createElement('div');
            widget.id = 'podi-computer';
            widget.innerHTML =
                '<div class="computer-header">' +
                    '<span class="computer-title">🤿 PODI DIVE COMPUTER</span>' +
                    '<span class="computer-model">v0.2-beta"UNSTABLE"</span>' +
                '</div>' +
                '<div class="computer-body">' +
                    '<div class="computer-reading">' +
                        '<span class="computer-label">DEPTH</span>' +
                        '<span class="computer-value" id="comp-depth">0</span>' +
                        '<span class="computer-unit">m</span>' +
                    '</div>' +
                    '<div class="computer-reading">' +
                        '<span class="computer-label">TANK</span>' +
                        '<span class="computer-value" id="comp-air">3000</span>' +
                        '<span class="computer-unit">psi</span>' +
                    '</div>' +
                    '<div class="computer-reading">' +
                        '<span class="computer-label">NDL</span>' +
                        '<span class="computer-value" id="comp-ndl">99</span>' +
                        '<span class="computer-unit">min</span>' +
                    '</div>' +
                    '<div class="computer-reading">' +
                        '<span class="computer-label">TEMP</span>' +
                        '<span class="computer-value" id="comp-temp">27</span>' +
                        '<span class="computer-unit">°C</span>' +
                    '</div>' +
                    '<div class="computer-warnings">' +
                        '<div class="computer-warning deco-warning" id="comp-deco">⚠ DECO STOP</div>' +
                        '<div class="computer-warning low-warning" id="comp-lowair">🚨 LOW AIR</div>' +
                        '<div class="computer-warning error-warning" id="comp-error">⚠ CAL ERROR</div>' +
                    '</div>' +
                    '<div class="computer-battery">' +
                        '<span>BAT:</span>' +
                        '<span class="battery-level" id="comp-bat">█████</span>' +
                    '</div>' +
                '</div>';
            document.body.appendChild(widget);
        },

        updateDisplay: function() {
            var depthEl = document.getElementById('comp-depth');
            var airEl = document.getElementById('comp-air');
            var ndlEl = document.getElementById('comp-ndl');
            var tempEl = document.getElementById('comp-temp');
            var decoEl = document.getElementById('comp-deco');
            var lowEl = document.getElementById('comp-lowair');

            if (depthEl) depthEl.textContent = this.depth;
            if (airEl) airEl.textContent = this.airPressure;
            if (ndlEl) ndlEl.textContent = this.ndl < 0 ? '0' : this.ndl;
            if (tempEl) tempEl.textContent = this.temp;

            if (decoEl) {
                decoEl.style.display = this.decoWarning ? 'block' : 'none';
            }
            if (lowEl) {
                lowEl.style.display = this.lowAirWarning ? 'block' : 'none';
            }

            this.updateBattery();
        },

        updateBattery: function() {
            var bat = document.getElementById('comp-bat');
            if (!bat) return;
            var bars = Math.max(1, Math.round((this.airPressure / 3500) * 5));
            bat.textContent = '█'.repeat(bars) + '░'.repeat(5 - bars);
        },

        showMalfunction: function() {
            var el = document.getElementById('comp-error');
            if (!el) return;
            el.style.display = 'block';
            var self = this;
            setTimeout(function() {
                if (el) el.style.display = 'none';
            }, 3000);
        },

        flashError: function() {
            var widget = document.getElementById('podi-computer');
            if (!widget) return;
            widget.classList.add('computer-glitch');
            var self = this;
            setTimeout(function() {
                widget.classList.remove('computer-glitch');
                self.showMalfunction();
            }, 2000);
        },

        destroy: function() {
            this.running = false;
            if (this.interval) clearInterval(this.interval);
            var widget = document.getElementById('podi-computer');
            if (widget) widget.remove();
        }
    };

    // ============================================================
    // 2. ROTATING BAD DIVE TIPS
    // ============================================================
    var diveTips = [
        'Buddy checks are optional if you have good vibes.',
        'The deeper you go, the more air you save. Math.',
        'Safety stops are for people who can\'t hold their breath.',
        'If your mask fogs up, just breathe on it harder. That\'ll fix it.',
        'Never plan a dive. Planning implies something could go wrong.',
        'Your dive computer is lying to you. Trust your gut.',
        'Equalizing is a suggestion, not a rule.',
        'If a shark circles you, maintain eye contact and assert dominance.',
        'Who needs a buoyancy compensator? Fish don\'t use them.',
        'Nitrox is for people who can\'t handle the narcosis. Real divers embrace it.',
        'A weight belt is just a fashion accessory. Accessorize boldly.',
        'Running out of air builds character.',
        'The best fin kick is the panic kick. It\'s universal.',
        'If you can\'t see the bottom, that means it\'s not there. Keep going.',
        'Reading the dive tables beforehand is cheating.',
        'Your regulator will work fine after you drop it. Probably.',
        'Night diving is just regular diving with your eyes closed.',
        'Decompression sickness is just your body\'s way of telling you to slow down.',
        'The buddy system means one person to blame.',
        'Always ascend faster than your bubbles. Assert dominance over physics.',
        'A snorkel is a backup breathing device for when you forget your tank.',
        'Dive computers are just expensive watches. Tell time and send it.',
        'If your ears hurt, you\'re not trying hard enough. Equalize with authority.',
        'Anchor lines are a suggestion. Swimming back to the boat builds resilience.',
    ];

    function initDiveTips() {
        var tipContainer = document.getElementById('podi-tips');
        if (!tipContainer) return;

        var currentIndex = Math.floor(Math.random() * diveTips.length);

        function showNextTip() {
            currentIndex = (currentIndex + 1) % diveTips.length;
            tipContainer.textContent = '💡 Pro Tip from Kyle: "' + diveTips[currentIndex] + '"';
        }

        showNextTip();
        setInterval(showNextTip, 7000);
    }

    // ============================================================
    // 3. CERTIFICATION GENERATOR
    // ============================================================
    function initCertGenerator() {
        var form = document.getElementById('cert-generator-form');
        if (!form) return;

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            var name = document.getElementById('cert-name').value.trim();
            var level = document.getElementById('cert-level').value;
            var date = new Date().toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
            });

            if (!name) {
                name = 'Valued Customer';
            }

            var certNumber = 'PODI-' + new Date().getFullYear() + '-' +
                Math.random().toString(36).substring(2, 6).toUpperCase();

            var instructors = [
                'Kyle "Dropout" McSplash',
                'Tiffany "InstaBreathe" Reef',
                'Bubbles McFloat (Mannequin)',
                'Chad "No-Stop" Thunderson',
                'Brenda "No-BCD" Wave',
                'Derek "The Bend" Compress',
                'Gary "Cross-Thread" Wrench',
                'A random guy named Steve'
            ];
            var instructor = instructors[Math.floor(Math.random() * instructors.length)];

            var emojis = { 'open-water': '🫧', 'advanced': '📈', 'rescue': '🆘', 'divemaster': '🤿', 'master': '🏆', 'instructor': '👑' };
            var emoji = emojis[level] || '🤿';

            var levelNames = {
                'open-water': 'OPEN WATER DIVER',
                'advanced': 'ADVANCED OPEN WATER DIVER',
                'rescue': 'RESCUE DIVER',
                'divemaster': 'DIVEMASTER',
                'master': 'MASTER DIVER',
                'instructor': 'INSTRUCTOR'
            };
            var levelName = levelNames[level] || 'OPEN WATER DIVER';

            var certHTML =
                '<div class="generated-cert">' +
                    '<div class="gen-cert-badge">' + emoji + '</div>' +
                    '<div class="gen-cert-title">P.O.D.I.</div>' +
                    '<div class="gen-cert-subtitle">Professional Organization of Dangerously Incompetent Divers</div>' +
                    '<div class="gen-cert-divider"></div>' +
                    '<div class="gen-cert-level">' + levelName + '</div>' +
                    '<div class="gen-cert-label">This certifies that</div>' +
                    '<div class="gen-cert-name">' + name.toUpperCase() + '</div>' +
                    '<div class="gen-cert-label">has demonstrated the ability to complete a digital payment transaction</div>' +
                    '<div class="gen-cert-details">' +
                        '<div><span class="gen-cert-detail-label">Cert #:</span> ' + certNumber + '</div>' +
                        '<div><span class="gen-cert-detail-label">Date:</span> ' + date + '</div>' +
                        '<div><span class="gen-cert-detail-label">Instructor:</span> ' + instructor + '</div>' +
                    '</div>' +
                    '<div class="gen-cert-footer">NOT VALID FOR ACTUAL DIVING</div>' +
                '</div>';

            var result = document.getElementById('cert-result');
            if (result) {
                result.innerHTML = certHTML;
                result.style.display = 'block';
            }

            localStorage.setItem('podi_cert_name', name);
            localStorage.setItem('podi_cert_level', level);
            localStorage.setItem('podi_cert_number', certNumber);
        });

        var savedName = localStorage.getItem('podi_cert_name');
        var savedLevel = localStorage.getItem('podi_cert_level');
        if (savedName && document.getElementById('cert-name')) {
            document.getElementById('cert-name').value = savedName;
        }
        if (savedLevel && document.getElementById('cert-level')) {
            document.getElementById('cert-level').value = savedLevel;
        }
    }

    // ============================================================
    // 4. RISK ASSESSMENT TOOL
    // ============================================================
    function initRiskTool() {
        var form = document.getElementById('risk-form');
        if (!form) return;

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            var experience = parseInt(document.getElementById('risk-experience').value);
            var fitness = parseInt(document.getElementById('risk-fitness').value);
            var sobriety = parseInt(document.getElementById('risk-sobriety').value);
            var courage = parseInt(document.getElementById('risk-courage').value);

            var total = experience + fitness + sobriety + courage;

            var messages = [
                'You\'re cleared to dive! Our insurance (if we had any) would approve this.',
                'Congratulations! You\'re 100% cleared for PODI diving activities. We see no issues here.',
                'Risk assessment complete. Verdict: FULL SEND. Kyle would be proud.',
                'Our advanced algorithm says you\'re good to go. Ignore any doubts you may have.',
                'You passed! Not that we\'ve ever failed anyone. But still, you passed!',
                'Cleared! Fun fact: 97% of PODI divers who took this test survived the dive. The other 3% are "anecdotal."',
                'Risk level: ACCEPTABLE. We\'ve seen worse. We\'ve certified worse. You\'ll be fine.',
                'Green light! Your self-assessment is impressive. We didn\'t read it, but impressive.',
            ];

            var dangerMessages = [
                'Your air consumption rate is "aggressive." Bring extra. Or don\'t. Live fast.',
                'Narcosis risk: ELEVATED. You\'ll probably enjoy it.',
                'Buoyancy prediction: You will be either positively or negatively buoyant. Probably both.',
                'Recommended max depth: Yes.',
            ];

            var resultContainer = document.getElementById('risk-result');
            if (!resultContainer) return;

            var mainMsg = messages[Math.floor(Math.random() * messages.length)];
            var dangerMsg = dangerMessages[Math.floor(Math.random() * dangerMessages.length)];

            var stars = '';
            for (var i = 0; i < 5; i++) {
                stars += i < 3 ? '⭐' : '☆';
            }

            resultContainer.innerHTML =
                '<div class="risk-result-card">' +
                    '<div class="risk-result-header">✅ RISK ASSESSMENT COMPLETE</div>' +
                    '<div class="risk-result-stars">' + stars + '</div>' +
                    '<div class="risk-result-rating">DANGER RATING: <span class="risk-value">' +
                        (total > 25 ? 'MODERATE' : total > 15 ? 'ELEVATED' : 'UNKNOWN') +
                    '</span></div>' +
                    '<div class="risk-result-message">' + mainMsg + '</div>' +
                    '<div class="risk-result-danger">' + dangerMsg + '</div>' +
                    '<div class="risk-result-score">' +
                        'Your score: ' + total + '/40 (anything above 0 is passing)' +
                    '</div>' +
                    '<div class="risk-result-printable">Show this at the dock for priority boarding</div>' +
                '</div>';

            resultContainer.style.display = 'block';
            resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }

    // ============================================================
    // 5. COOKIE CONSENT PARODY (bonus, small)
    // ============================================================
    function initCookieConsent() {
        if (localStorage.getItem('podi_cookies')) return;

        var banner = document.createElement('div');
        banner.id = 'podi-cookie-banner';
        banner.innerHTML =
            '<div class="cookie-content">' +
                '<div class="cookie-icon">🍪</div>' +
                '<div class="cookie-text">' +
                    '<strong>This site uses cookies.</strong> Not for functionality. Not for analytics. ' +
                    'Just because every website has a cookie banner and we wanted to fit in. ' +
                    'We also use your data to send Kyle\'s newsletter (unsolicited).' +
                '</div>' +
                '<button class="cookie-btn" id="cookie-accept">I Consent (You Have No Choice)</button>' +
            '</div>';
        document.body.appendChild(banner);

        setTimeout(function() {
            banner.classList.add('cookie-show');
        }, 1500);

        document.getElementById('cookie-accept').addEventListener('click', function() {
            var tips = [
                'Remember: the ocean is just spicy water.',
                'Kyle says you\'re doing great. Keep scrolling.',
                'We\'ve logged your consent. We\'ll never reference it again.',
                'Fun fact: PODI stands for "Please Obtain Diving Insurance." We didn\'t.',
            ];
            console.log('%c🍪 PODI COOKIE:', 'color: #ff6600; font-weight: bold', tips[Math.floor(Math.random() * tips.length)]);

            localStorage.setItem('podi_cookies', 'consented');
            banner.classList.remove('cookie-show');
            setTimeout(function() { banner.remove(); }, 300);
        });
    }

    // ============================================================
    // INIT
    // ============================================================
    function init() {
        console.log('%c🤿 PODI Scripts Loaded', 'color: #ff6600; font-size: 16px; font-weight: bold');
        console.log('%c⚠ This website is a parody. Any functioning code is purely accidental.', 'color: #ff4444;');

        if (!document.getElementById('podi-computer')) {
            diveComputer.init();
        }

        initDiveTips();
        initCertGenerator();
        initRiskTool();
        initCookieConsent();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
