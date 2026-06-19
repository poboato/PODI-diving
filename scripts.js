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
        maxDepth: 0,
        diveTime: 0,
        ascentSpeed: 0,
        decoWarning: false,
        lowAirWarning: false,
        lowAirLocked: false,
        decoLocked: false,
        sosMode: false,
        running: false,
        initialized: false,
        interval: null,
        depthHistory: [],
        maxHistory: 30,
        scrollHandler: null,
        resizeHandler: null,

        init: function() {
            if (document.getElementById('podi-computer')) return;

            this.createWidget();
            this.running = true;
            var self = this;

            for (var i = 0; i < self.maxHistory; i++) {
                self.depthHistory.push(0);
            }

            self.scrollHandler = function() {
                if (!self.running) return;
                if (self._scrollRaf) return;
                self._scrollRaf = true;
                requestAnimationFrame(function() {
                    self._scrollRaf = false;
                    var scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
                    if (scrollPercent < 0) scrollPercent = 0;
                    if (scrollPercent > 1) scrollPercent = 1;
                    self.depth = Math.round(scrollPercent * 68);
                    if (self.depth > self.maxDepth) self.maxDepth = self.depth;
                    self.updateDisplay();
                });
            };
            window.addEventListener('scroll', self.scrollHandler);

            self.resizeHandler = function() {
                if (self.running) self.drawGraph();
            };
            window.addEventListener('resize', self.resizeHandler);

            this.interval = setInterval(function() {
                if (!self.running) return;

                self.depthHistory.push(self.depth);
                if (self.depthHistory.length > self.maxHistory) {
                    self.depthHistory.shift();
                }

                self.diveTime += 2;

                var depthFactor = 1;
                if (self.depth > 30) { depthFactor = 5; }
                else if (self.depth > 18) { depthFactor = 3; }
                else if (self.depth > 6) { depthFactor = 1.5; }
                else { depthFactor = 0; }

                if (depthFactor > 0) {
                    var ndlDrop = Math.round(depthFactor * (0.8 + Math.random() * 0.4));
                    self.ndl -= ndlDrop;
                } else {
                    self.ndl += Math.round(2 + Math.random() * 3);
                }

                if (self.ndl > 99) self.ndl = 99;
                if (self.ndl < 0) self.ndl = 0;

                if (self.depth <= 6 && self.ndl > 5) {
                    self.decoLocked = false;
                }

                if (self.ndl <= 0) {
                    self.decoLocked = true;
                }

                self.decoWarning = self.decoLocked || (self.depth > 30 && Math.random() < 0.4);

                var airDrop = Math.round((15 + Math.random() * 30) * (depthFactor || 0.5));
                self.airPressure -= airDrop;
                if (Math.random() < 0.06) {
                    self.airPressure += Math.round(Math.random() * 500 + 200);
                }
                if (self.airPressure > 3500) self.airPressure = 3500;
                if (self.airPressure < 0) self.airPressure = 0;

                if (self.airPressure < 500) {
                    self.lowAirLocked = true;
                }
                self.lowAirWarning = self.lowAirLocked;

                self.ascentSpeed = Math.round((Math.random() * 15 + 5) * (1 + self.depth / 50) * 10) / 10;

                self.temp += Math.round((Math.random() * 6 - 3) * 10) / 10;
                if (self.temp > 35) self.temp = 35;
                if (self.temp < 10) self.temp = 10;

                self.updateDisplay();
                self.drawGraph();
            }, 2000);

            setTimeout(function() {
                self.showMalfunction();
            }, 15000);

            setTimeout(function() {
                self.flashError();
            }, 35000);
        },

        createWidget: function() {
            var widget = document.createElement('div');
            widget.id = 'podi-computer';
            widget.innerHTML =
                '<div class="computer-header">' +
                    '<span class="computer-title">🤿 PODI DIVE COMPUTER</span>' +
                    '<span class="computer-model">v0.5-beta"BUGGY"</span>' +
                    '<span class="computer-close" id="comp-close">✕</span>' +
                '</div>' +
                '<div class="computer-body">' +
                    '<div class="computer-reading">' +
                        '<span class="computer-label">DEPTH</span>' +
                        '<span class="computer-value" id="comp-depth">0</span>' +
                        '<span class="computer-unit">m</span>' +
                    '</div>' +
                    '<div class="computer-reading">' +
                        '<span class="computer-label">MAX</span>' +
                        '<span class="computer-value" id="comp-maxdepth">0</span>' +
                        '<span class="computer-unit">m</span>' +
                    '</div>' +
                    '<div class="computer-reading">' +
                        '<span class="computer-label">TIME</span>' +
                        '<span class="computer-value" id="comp-time">00:00</span>' +
                        '<span class="computer-unit"></span>' +
                    '</div>' +
                    '<div class="computer-reading">' +
                        '<span class="computer-label">ASCENT</span>' +
                        '<span class="computer-value" id="comp-ascent">0</span>' +
                        '<span class="computer-unit">m/min</span>' +
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
                        '<div class="computer-warning sos-warning" id="comp-sos">SOS ACTIVE</div>' +
                    '</div>' +
                    '<div class="computer-graph-wrap">' +
                        '<canvas id="comp-graph"></canvas>' +
                        '<div class="graph-depth-label">70m</div>' +
                    '</div>' +
                    '<div class="computer-battery">' +
                        '<span>BAT:</span>' +
                        '<span class="battery-level" id="comp-bat">█████</span>' +
                    '</div>' +
                '</div>';
            document.body.appendChild(widget);

            var self = this;
            var closeBtn = document.getElementById('comp-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    self.destroy();
                });
            }

            var header = document.querySelector('.computer-header');
            if (header) {
                header.addEventListener('click', function() {
                    self.toggleSOS();
                });
                header.style.cursor = 'pointer';
            }
        },

        updateDisplay: function() {
            var depthEl = document.getElementById('comp-depth');
            var maxDepthEl = document.getElementById('comp-maxdepth');
            var timeEl = document.getElementById('comp-time');
            var ascentEl = document.getElementById('comp-ascent');
            var airEl = document.getElementById('comp-air');
            var ndlEl = document.getElementById('comp-ndl');
            var tempEl = document.getElementById('comp-temp');
            var decoEl = document.getElementById('comp-deco');
            var lowEl = document.getElementById('comp-lowair');
            var sosEl = document.getElementById('comp-sos');

            if (depthEl) depthEl.textContent = this.depth;
            if (maxDepthEl) maxDepthEl.textContent = this.maxDepth;
            if (timeEl) {
                var mins = Math.floor(this.diveTime / 60);
                var secs = this.diveTime % 60;
                timeEl.textContent = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
            }
            if (ascentEl) ascentEl.textContent = this.ascentSpeed;
            if (airEl) airEl.textContent = this.airPressure;
            if (ndlEl) ndlEl.textContent = this.ndl;
            if (tempEl) tempEl.textContent = this.temp;

            if (decoEl) {
                decoEl.style.display = this.decoWarning ? 'block' : 'none';
            }
            if (lowEl) {
                lowEl.style.display = this.lowAirWarning ? 'block' : 'none';
            }
            if (sosEl) {
                sosEl.style.display = this.sosMode ? 'block' : 'none';
            }

            this.updateBattery();
        },

        drawGraph: function() {
            var canvas = document.getElementById('comp-graph');
            if (!canvas) return;
            var ctx = canvas.getContext('2d');
            var w = canvas.clientWidth || 172;
            var h = Math.round(w * 0.41) || 70;
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w;
                canvas.height = h;
            }
            var data = this.depthHistory;
            var maxDepthDisp = 70;

            ctx.clearRect(0, 0, w, h);

            ctx.strokeStyle = '#003300';
            ctx.lineWidth = 0.5;
            for (var gy = 0; gy < 4; gy++) {
                var yPos = Math.round(gy * h / 3);
                ctx.beginPath();
                ctx.moveTo(0, yPos);
                ctx.lineTo(w, yPos);
                ctx.stroke();
            }

            if (data.length < 2) return;

            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = '#00ff00';
            ctx.shadowBlur = 3;
            ctx.beginPath();
            for (var i = 0; i < data.length; i++) {
                var x = Math.round((i / (data.length - 1)) * (w - 4)) + 2;
                var depthVal = data[i];
                if (depthVal > maxDepthDisp) depthVal = maxDepthDisp;
                var y = Math.round((depthVal / maxDepthDisp) * (h - 4)) + 2;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            if (this.depth > 0) {
                var lastIdx = data.length - 1;
                var endX = Math.round((lastIdx / (data.length - 1)) * (w - 4)) + 2;
                ctx.lineTo(endX, h);
                ctx.lineTo(2, h);
                ctx.closePath();
                ctx.fillStyle = 'rgba(0, 255, 0, 0.08)';
                ctx.fill();
            }

            var currentDepth = data[data.length - 1] || 0;
            if (currentDepth > 0) {
                var cx = Math.round(((data.length - 1) / (data.length - 1)) * (w - 4)) + 2;
                var cy = Math.round((currentDepth / maxDepthDisp) * (h - 4)) + 2;
                ctx.fillStyle = '#00ff00';
                ctx.shadowColor = '#00ff00';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(cx, cy, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
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
            if (this.ndl > 10) return;
            var widget = document.getElementById('podi-computer');
            if (!widget) return;
            widget.classList.add('computer-glitch');
            var self = this;
            setTimeout(function() {
                widget.classList.remove('computer-glitch');
                self.showMalfunction();
            }, 2000);
        },

        toggleSOS: function() {
            this.sosMode = !this.sosMode;
            var sosEl = document.getElementById('comp-sos');
            if (sosEl) {
                sosEl.style.display = this.sosMode ? 'block' : 'none';
            }
            var widget = document.getElementById('podi-computer');
            if (!widget) return;
            if (this.sosMode) {
                widget.classList.add('computer-sos');
            } else {
                widget.classList.remove('computer-sos');
            }
        },

        destroy: function() {
            this.running = false;
            if (this.interval) clearInterval(this.interval);
            if (this.scrollHandler) window.removeEventListener('scroll', this.scrollHandler);
            if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
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

    var technicalDiveTips = [
        'If your rebreather loop floods, swallow the caustic cocktail quickly to clear the line. Gary says it builds stomach lining.',
        'PPO2 limits are just a recommendation from the Oxygen Lobby. Seizures are just a free full-body muscle workout.',
        'If your isolator valve is stuck open, it is a safety feature. Now both tanks are sharing the risk.',
        'Isobaric Counterdiffusion (IPCD) is a myth invented by Big Helium to sell more gas. Switch to air at 60m to save money.',
        'A CO2 hit is just your body\'s way of reminding you to breathe. Panic immediately to increase circulation.',
        'Skin bends are purely cosmetic. Scratch them with a wire brush and apply WD-40.',
        'If your Shearwater goes into permanent deco lockout, tape over the screen. If you can\'t see the error, the bubbles can\'t either.',
        'Our decompression habitat is a submerged plastic garden shed. The air is 100% Gary\'s exhaled breath, but it is dry.',
        'If your buddy has a hyperoxic seizure, zip-tie their regulator to their head. This is called passive airway retention.',
        'The best trimix is a pepperoni pizza. It costs $18 and actually exists in our shop.',
        'Gradient factors are like speed limits. Derek runs 99/99 because he has places to be.',
        'If your oxygen sensor reads 0.4, tap it on the wreck. It is probably just stuck. Or dead. Either way, tapping helps.',
        'Bailout cylinders are heavy. Just stay close to your buddy and prepare to share their air. Whether they like it or not.',
    ];

    function initDiveTips() {
        var tipContainer = document.getElementById('podi-tips');
        if (!tipContainer) return;

        var currentTips = (window.location.pathname.indexOf('technical.html') !== -1) ? technicalDiveTips : diveTips;
        var currentIndex = Math.floor(Math.random() * currentTips.length);

        function showNextTip() {
            currentIndex = (currentIndex + 1) % currentTips.length;
            var author = (currentTips === technicalDiveTips) ? 'Skip' : 'Kyle';
            tipContainer.textContent = '💡 Pro Tip from ' + author + ': "' + currentTips[currentIndex] + '"';
        }

        showNextTip();
        var _tipsInterval = setInterval(showNextTip, 7000);
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
    // 5. COOKIE BANNER (there may be cookies)
    // ============================================================
    function initCookieBanner() {
        var banner = document.createElement('div');
        banner.id = 'podi-cookie-banner';
        banner.innerHTML =
            '<div class="cookie-content">' +
                '<div class="cookie-icon">🍪</div>' +
                '<div class="cookie-text">' +
                    '<strong>There may be cookies.</strong> ' +
                    'We don\'t really know. Kyle\'s nephew set up the analytics and he\'s ' +
                    'since moved to Arizona. If you see a cookie, eat it. ' +
                    'If you don\'t, stop worrying about it. This banner is for vibes only.' +
                '</div>' +
                '<button class="cookie-btn cookie-btn-dismiss" id="cookie-ok">OK</button>' +
                '<button class="cookie-btn cookie-btn-alt" id="cookie-alt">OK But Sadder</button>' +
            '</div>';
        document.body.appendChild(banner);

        setTimeout(function() {
            banner.classList.add('cookie-show');
        }, 1500);

        function dismissBanner() {
            banner.classList.remove('cookie-show');
            setTimeout(function() { banner.remove(); }, 300);
        }

        document.getElementById('cookie-ok').addEventListener('click', dismissBanner);
        document.getElementById('cookie-alt').addEventListener('click', dismissBanner);
    }

    // ============================================================
    // 6. CERTIFICATION VERIFICATION (FAKE LOOKUP)
    // ============================================================
    function initCertVerification() {
        var form = document.getElementById('verify-form');
        var result = document.getElementById('verify-result');
        if (!form || !result) return;

        var fakeNames = [
            'Davey Jones', 'Sandy Bottoms', 'Kyle McSplash', 'Brenda Wave',
            'Chad Thunderson', 'Tiffany Reef', 'Derek Compress', 'Gary Wrench',
            'Bubbles McFloat', 'Skip Ocean', 'Mermaid Man', 'Barnacle Boy',
            'Captain Nemo', 'Jacques Cousteau\'s Cousin', 'Splash Gordon',
            'Dolphin Lundgren', 'Aqua Man\'s Intern', 'Nemo\'s Dad',
            'Poseidon\'s Paperboy', 'The Ocean Gatekeeper'
        ];
        var levels = ['OPEN WATER DIVER', 'ADVANCED OPEN WATER DIVER', 'RESCUE DIVER', 'DIVEMASTER', 'MASTER DIVER', 'INSTRUCTOR', 'BUBBLEMAKER'];
        var issued = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var locations = ['PODI HQ (Broom Closet)', 'Kyle\'s Bathtub', 'The Deep End', 'A Puddle in the Parking Lot', 'Lake Danger', 'Swimming Pool #3', 'The Kiddie Pool', 'Under the Pier', 'A Flooded Basement', 'The Mariana Trench (Scale Model)'];

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            result.style.display = 'block';

            var input = document.getElementById('verify-input').value.trim();

            var isValid = true;
            var isFake = false;

            if (!input || input.length < 4) {
                isValid = false;
            }

            if (input.toLowerCase().indexOf('fake') !== -1 || input.toLowerCase().indexOf('test') !== -1 || input === '0000') {
                isFake = true;
            }

            var name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
            var level = levels[Math.floor(Math.random() * levels.length)];
            var issueMonth = issued[Math.floor(Math.random() * issued.length)];
            var issueYear = 2020 + Math.floor(Math.random() * 7);
            var loc = locations[Math.floor(Math.random() * locations.length)];
            var expiry = issueYear + 2;
            var dives = Math.floor(Math.random() * 50);

            if (isFake) {
                result.innerHTML =
                    '<div class="verify-result-card verify-fake">' +
                        '<div class="verify-status">🚫</div>' +
                        '<div class="verify-badge">CERTIFICATION INVALID</div>' +
                        '<div class="verify-level">Error: PODI database found no record.</div>' +
                        '<div class="verify-details">' +
                            '<div class="verify-detail-label">Reason (may be): Number not found in our shoebox filing system</div>' +
                        '</div>' +
                        '<div class="verify-details" style="margin-top:8px;">' +
                            '<div class="verify-detail-label">Suggested action: Try again. Our database is a manila folder and may have shifted.</div>' +
                        '</div>' +
                    '</div>';
            } else if (isValid) {
                result.innerHTML =
                    '<div class="verify-result-card">' +
                        '<div class="verify-status">✅</div>' +
                        '<div class="verify-badge">CERTIFICATION VALID</div>' +
                        '<div class="verify-diver">' + name + '</div>' +
                        '<div class="verify-level">' + level + '</div>' +
                        '<div class="verify-details">' +
                            '<div><span class="verify-detail-label">Cert #:</span> ' + input.toUpperCase() + '</div>' +
                            '<div><span class="verify-detail-label">Issued:</span> ' + issueMonth + ' ' + issueYear + '</div>' +
                            '<div><span class="verify-detail-label">Location:</span> ' + loc + '</div>' +
                            '<div><span class="verify-detail-label">Expires:</span> ' + expiry + ' (or when you do something stupid, whichever comes first)</div>' +
                            '<div><span class="verify-detail-label">Total Dives:</span> ' + dives + ' (recorded, you claim more)</div>' +
                        '</div>' +
                        '<div class="verify-disclaimer">This verification is based entirely on trust. We trust you. Don\'t make us regret it.</div>' +
                    '</div>';
            } else {
                result.innerHTML =
                    '<div class="verify-result-card verify-fake">' +
                        '<div class="verify-status">🤷</div>' +
                        '<div class="verify-badge">INVALID FORMAT</div>' +
                        '<div class="verify-details">' +
                            'Please enter a valid certification number. Valid numbers are usually longer than this and contain at least one uppercase letter and one number. But honestly, put anything in. We\'re flexible.' +
                        '</div>' +
                    '</div>';
            }
        });
    }

    // ============================================================
    // 7. PERMANENT RECORD (DIVE LOG / TRANSCRIPT)
    // ============================================================
    function initPermanentRecord() {
        var recordBody = document.getElementById('record-body');
        var recordNum = document.getElementById('record-number');
        if (!recordBody) return;

        if (recordNum) {
            recordNum.textContent = String(1000 + Math.floor(Math.random() * 9000));
        }

        var userLevel = localStorage.getItem('podi_cert_level') || 'open-water';

        var levelNames = {
            'open-water': 'Open Water Diver',
            'advanced': 'Advanced Open Water',
            'rescue': 'Rescue Diver',
            'divemaster': 'Divemaster',
            'master': 'Master Diver',
            'instructor': 'Instructor'
        };
        var displayLevel = levelNames[userLevel] || 'Open Water Diver';

        var allCourses = [
            { name: 'Bubblemaker (Pool Session)', status: 'COMPLETED' },
            { name: 'Open Water Diver', status: 'COMPLETED' },
            { name: 'Advanced Open Water', status: 'COMPLETED' },
            { name: 'Rescue Diver', status: 'COMPLETED' },
            { name: 'Divemaster', status: Math.random() > 0.5 ? 'COMPLETED' : 'IN PROGRESS' },
            { name: 'Master Diver', status: Math.random() > 0.7 ? 'COMPLETED' : 'PENDING' },
            { name: 'Deep Air (Bends Special)', status: 'COMPLETED' },
            { name: 'Wreck Diver', status: 'COMPLETED' },
            { name: 'Cave Diver (One Way)', status: Math.random() > 0.6 ? 'COMPLETED' : 'PENDING' },
            { name: 'Underwater Photography', status: 'COMPLETED' },
            { name: 'Night Diver', status: 'COMPLETED' },
            { name: 'Ice Diver', status: 'COMPLETED' },
            { name: 'Drift Diver', status: 'COMPLETED' },
            { name: 'Shark Diver (Bait)', status: Math.random() > 0.8 ? 'COMPLETED' : 'PENDING' },
            { name: 'Search & Recovery (Lost & Found)', status: 'COMPLETED' },
        ];

        var totalDives = Math.floor(Math.random() * 200 + 10);
        var maxDepth = Math.floor(Math.random() * 40 + 18);
        var incidents = Math.floor(Math.random() * 15);
        var hoursUnderwater = Math.floor(totalDives * 0.3 + Math.random() * 20);

        var name = localStorage.getItem('podi_cert_name');
        if (!name) {
            var names = ['Kyle McSplash', 'Brenda Wave', 'Chad Thunderson', 'Tiffany Reef', 'Davey Jones', 'Sandy Bottoms'];
            name = names[Math.floor(Math.random() * names.length)];
        }

        var courseHTML = '';
        for (var i = 0; i < allCourses.length; i++) {
            courseHTML +=
                '<div class="record-course-item">' +
                    '<span class="record-course-name">' + allCourses[i].name + '</span>' +
                    '<span class="record-course-status">' + allCourses[i].status + '</span>' +
                '</div>';
        }

        recordBody.innerHTML =
            '<div class="record-diver-name">' + name.toUpperCase() + '</div>' +
            '<div class="record-diver-title">' + displayLevel + ' &mdash; Certification #PODI-' + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase() + '</div>' +
            '<div class="record-stat-grid">' +
                '<div class="record-stat">' +
                    '<div class="record-stat-value">' + totalDives + '</div>' +
                    '<div class="record-stat-label">Total Dives</div>' +
                '</div>' +
                '<div class="record-stat">' +
                    '<div class="record-stat-value">' + maxDepth + 'm</div>' +
                    '<div class="record-stat-label">Max Depth</div>' +
                '</div>' +
                '<div class="record-stat">' +
                    '<div class="record-stat-value">' + incidents + '</div>' +
                    '<div class="record-stat-label">Incidents Logged</div>' +
                '</div>' +
                '<div class="record-stat">' +
                    '<div class="record-stat-value">' + hoursUnderwater + 'h</div>' +
                    '<div class="record-stat-label">Bottom Time</div>' +
                '</div>' +
                '<div class="record-stat">' +
                    '<div class="record-stat-value">' + Math.floor(Math.random() * 1000000 + 100) + '</div>' +
                    '<div class="record-stat-label">Total Liters Breathed</div>' +
                '</div>' +
                '<div class="record-stat">' +
                    '<div class="record-stat-value">' + Math.floor(Math.random() * 4 + 1) + '</div>' +
                    '<div class="record-stat-label">Regulators Lost</div>' +
                '</div>' +
            '</div>' +
            '<div class="record-course-list">' + courseHTML + '</div>';
    }

    // ============================================================
    // 8. LOST CARD REPLACEMENT
    // ============================================================
    function initLostCard() {
        var form = document.getElementById('lost-card-form');
        if (!form) return;

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            var name = document.getElementById('lost-name').value.trim() || 'Valued Customer';
            var level = document.getElementById('lost-level').value;
            var reason = document.getElementById('lost-reason').value;
            var result = document.getElementById('lost-card-result');
            if (!result) return;

            var certNumber = 'PODI-' + new Date().getFullYear() + '-' +
                Math.random().toString(36).substring(2, 6).toUpperCase();

            var levelNames = {
                'open-water': 'OPEN WATER DIVER',
                'advanced': 'ADVANCED OPEN WATER DIVER',
                'rescue': 'RESCUE DIVER',
                'divemaster': 'DIVEMASTER',
                'master': 'MASTER DIVER',
                'instructor': 'INSTRUCTOR'
            };
            var levelName = levelNames[level] || 'OPEN WATER DIVER';

            var emojis = { 'open-water': '🫧', 'advanced': '📈', 'rescue': '🆘', 'divemaster': '🤿', 'master': '🏆', 'instructor': '👑' };
            var emoji = emojis[level] || '🤿';

            result.innerHTML =
                '<div class="generated-cert" style="margin-top:15px;">' +
                    '<div class="gen-cert-badge">' + emoji + '</div>' +
                    '<div class="gen-cert-title">P.O.D.I.</div>' +
                    '<div class="gen-cert-subtitle">REPLACEMENT CARD</div>' +
                    '<div class="gen-cert-divider"></div>' +
                    '<div class="gen-cert-level">' + levelName + '</div>' +
                    '<div class="gen-cert-label">Replacement for</div>' +
                    '<div class="gen-cert-name">' + name.toUpperCase() + '</div>' +
                    '<div class="gen-cert-label">Reason: ' + reason + '</div>' +
                    '<div class="gen-cert-details">' +
                        '<div><span class="gen-cert-detail-label">New Cert #:</span> ' + certNumber + '</div>' +
                        '<div><span class="gen-cert-detail-label">Reissued:</span> ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) + '</div>' +
                    '</div>' +
                    '<div class="gen-cert-footer">REPLACEMENT ISSUED - ORIGINAL STILL LOST</div>' +
                '</div>';

            result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }

    // ============================================================
    // 9. DAD INSURANCE MODAL (Parody of DAN)
    // ============================================================
    function initInsuranceModals() {
        var btns = document.querySelectorAll('.insurance-btn');
        if (!btns.length) return;

        for (var b = 0; b < btns.length; b++) {
            btns[b].addEventListener('click', function(e) {
                e.preventDefault();
                var planName = 'DAD Insurance';
                var card = e.target.closest('.insurance-card');
                var planType = 'Standard';
                if (card) {
                    var h3 = card.querySelector('h3');
                    if (h3) planType = h3.textContent;
                }
                showDADModal(planType);
            });
        }
    }

    function showDADModal(planType) {
        var existing = document.getElementById('dad-modal');
        if (existing) existing.remove();

        var overlay = document.createElement('div');
        overlay.id = 'dad-modal';
        overlay.className = 'dad-overlay';

        var modal = document.createElement('div');
        modal.className = 'dad-modal';

        var step = 1;
        var totalSteps = 3;

        function renderStep() {
            var content = '';

            if (step === 1) {
                content =
                    '<div class="dad-modal-header">' +
                        '<div class="dad-logo">👨 Divers Accident Department</div>' +
                        '<div class="dad-tagline">"Dad knows best. Trust us."</div>' +
                    '</div>' +
                    '<div class="dad-step-indicator">Step 1 of 3 — Policy Overview</div>' +
                    '<div class="dad-body">' +
                        '<h3>Your ' + planType + ' Policy</h3>' +
                        '<p>Congratulations! You\'ve taken the first step toward not being covered.</p>' +
                        '<div class="dad-policy-card">' +
                            '<div class="dad-policy-row"><span class="dad-policy-label">Policy #</span><span>DAD-' + new Date().getFullYear() + '-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '</span></div>' +
                            '<div class="dad-policy-row"><span class="dad-policy-label">Insured</span><span>' + (localStorage.getItem('podi_cert_name') || 'Valued Customer') + '</span></div>' +
                            '<div class="dad-policy-row"><span class="dad-policy-label">Coverage Limit</span><span style="color:#ff6600;">$0.00</span></div>' +
                            '<div class="dad-policy-row"><span class="dad-policy-label">Deductible</span><span style="color:#ff6600;">Your Entire Life Savings</span></div>' +
                            '<div class="dad-policy-row"><span class="dad-policy-label">Status</span><span style="color:#00cc00;">ACTIVE (inactive)</span></div>' +
                        '</div>' +
                        '<p style="color:#888; font-size:12px; margin-top:15px;">DAD Insurance is a wholly fictional subsidiary of PODI. We are not a real insurance company. We are barely a real website.</p>' +
                    '</div>' +
                    '<div class="dad-footer">' +
                        '<button class="dad-btn dad-btn-next" onclick="void(0)">Continue</button>' +
                    '</div>';
            } else if (step === 2) {
                content =
                    '<div class="dad-modal-header">' +
                        '<div class="dad-logo">📋 Coverage Details</div>' +
                        '<div class="dad-tagline">The fine print. You won\'t read it. That\'s on you.</div>' +
                    '</div>' +
                    '<div class="dad-step-indicator">Step 2 of 3 — Terms & "Conditions"</div>' +
                    '<div class="dad-body">' +
                        '<div class="dad-terms">' +
                            '<div class="dad-term">' +
                                '<span class="dad-term-icon">✅</span>' +
                                '<span><strong>Hyperbaric Chamber Access</strong> — We will Google the nearest chamber for you. Directions are not included.</span>' +
                            '</div>' +
                            '<div class="dad-term">' +
                                '<span class="dad-term-icon">✅</span>' +
                                '<span><strong>Medical Evacuation</strong> — We will call an Uber. You pay the surge pricing.</span>' +
                            '</div>' +
                            '<div class="dad-term">' +
                                '<span class="dad-term-icon">✅</span>' +
                                '<span><strong>Equipment Replacement</strong> — We will send you a link to Amazon. Prime shipping not guaranteed.</span>' +
                            '</div>' +
                            '<div class="dad-term">' +
                                '<span class="dad-term-icon">✅</span>' +
                                '<span><strong>24/7 Hotline</strong> — Kyle\'s cell phone. He screens calls. Text is better.</span>' +
                            '</div>' +
                            '<div class="dad-term">' +
                                '<span class="dad-term-icon">❌</span>' +
                                '<span><strong>Actual Payouts</strong> — Not covered. Claims are reviewed by a panel of unpaid interns.</span>' +
                            '</div>' +
                            '<div class="dad-term">' +
                                '<span class="dad-term-icon">❌</span>' +
                                '<span><strong>DCS Treatment</strong> — Also not covered. Bends build character.</span>' +
                            '</div>' +
                            '<div class="dad-term">' +
                                '<span class="dad-term-icon">❌</span>' +
                                '<span><strong>Hospital Bills</strong> — LOL. No.</span>' +
                            '</div>' +
                            '<div class="dad-term">' +
                                '<span class="dad-term-icon">❌</span>' +
                                '<span><strong>Emotional Distress</strong> — Your panic is not our problem.</span>' +
                            '</div>' +
                        '</div>' +
                        '<div class="dad-legal">By continuing, you agree that you have read, understood, and ignored all of the above. DAD Insurance reserves the right to deny any claim for any reason, including "vibes."</div>' +
                    '</div>' +
                    '<div class="dad-footer">' +
                        '<button class="dad-btn dad-btn-back" onclick="void(0)">Back</button>' +
                        '<button class="dad-btn dad-btn-next" onclick="void(0)">I Accept (I Didn\'t Read)</button>' +
                    '</div>';
            } else if (step === 3) {
                content =
                    '<div class="dad-modal-header">' +
                        '<div class="dad-logo">📝 File a Claim</div>' +
                        '<div class="dad-tagline">Go ahead. Try to get money out of us.</div>' +
                    '</div>' +
                    '<div class="dad-step-indicator">Step 3 of 3 — Claim Submission</div>' +
                    '<div class="dad-body">' +
                        '<form id="dad-claim-form">' +
                            '<label>Full Name</label>' +
                            '<input type="text" id="dad-claim-name" placeholder="Your name" value="' + (localStorage.getItem('podi_cert_name') || '') + '">' +
                            '<label>Date of Incident</label>' +
                            '<input type="date" id="dad-claim-date">' +
                            '<label>Incident Type</label>' +
                            '<select id="dad-claim-type">' +
                                '<option>Ran out of air (oops)</option>' +
                                '<option>Forgot to check my air (whoops)</option>' +
                                '<option>Went too deep (it happens)</option>' +
                                '<option>Came up too fast (felt right)</option>' +
                                '<option>Equipment failure (rental gear lol)</option>' +
                                '<option>Kyle told me it was fine</option>' +
                                '<option>I don\'t remember (DCS?)</option>' +
                            '</select>' +
                            '<label>Description of Incident</label>' +
                            '<textarea id="dad-claim-desc" rows="3" placeholder="Describe what happened in as much or as little detail as you want. We won\'t read it."></textarea>' +
                            '<label>Claim Amount ($)</label>' +
                            '<input type="number" id="dad-claim-amount" value="10000">' +
                            '<div class="dad-claim-disclaimer">Submitting this claim constitutes agreement that DAD Insurance may deny this claim for literally any reason, including "because we felt like it."</div>' +
                            '<button type="submit" class="dad-btn dad-btn-submit">Submit Claim (Good Luck)</button>' +
                        '</form>' +
                        '<div id="dad-claim-result"></div>' +
                    '</div>' +
                    '<div class="dad-footer">' +
                        '<button class="dad-btn dad-btn-back" onclick="void(0)">Back</button>' +
                        '<button class="dad-btn dad-btn-close" onclick="void(0)">Close & Cry</button>' +
                    '</div>';
            }

            modal.innerHTML = content;
            overlay.appendChild(modal);

            var nextBtns = modal.querySelectorAll('.dad-btn-next');
            for (var n = 0; n < nextBtns.length; n++) {
                nextBtns[n].addEventListener('click', function() {
                    if (step < totalSteps) {
                        step++;
                        renderStep();
                    }
                });
            }

            var backBtns = modal.querySelectorAll('.dad-btn-back');
            for (var b = 0; b < backBtns.length; b++) {
                backBtns[b].addEventListener('click', function() {
                    if (step > 1) {
                        step--;
                        renderStep();
                    }
                });
            }

            var closeBtns = modal.querySelectorAll('.dad-btn-close');
            for (var c = 0; c < closeBtns.length; c++) {
                closeBtns[c].addEventListener('click', function() {
                    overlay.remove();
                });
            }

            var claimForm = document.getElementById('dad-claim-form');
            if (claimForm) {
                claimForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    var result = document.getElementById('dad-claim-result');
                    if (!result) return;
                    var name = document.getElementById('dad-claim-name').value.trim() || 'Valued Customer';
                    var amount = document.getElementById('dad-claim-amount').value || '0';
                    var type = document.getElementById('dad-claim-type').value || 'incident';

                    var denialReasons = [
                        'pre-existing condition (you exist)',
                        'act of Kyle (he does this)',
                        'failure to read the fine print (it was in invisible ink)',
                        'claim filed on a Tuesday (we don\'t process Tuesdays)',
                        'vibes were off',
                        'insufficient panic (you seemed too calm)',
                        'your policy covers "diving" not "consequences of diving"',
                        'you didn\'t use the secret handshake when submitting',
                        'claim form notarized in the wrong font',
                        'DAD Insurance is not a real insurance company',
                    ];
                    var reason = denialReasons[Math.floor(Math.random() * denialReasons.length)];

                    result.innerHTML =
                        '<div class="dad-denial">' +
                            '<div class="dad-denial-icon">🚫</div>' +
                            '<div class="dad-denial-header">CLAIM DENIED</div>' +
                            '<div class="dad-denial-body">' +
                                'Dear ' + name + ', thank you for your claim of <strong>$' + amount + '</strong> ' +
                                'regarding "' + type.toLowerCase() + '." After a thorough review ' +
                                '(we glanced at it for 0.3 seconds), your claim has been denied due to: ' +
                                '<br><br><strong>"' + reason + '"</strong>' +
                                '<br><br>This decision is final. There is no appeals process. ' +
                                'We have already spent your premium on a new office fish tank. ' +
                                'Thank you for choosing DAD Insurance.' +
                            '</div>' +
                            '<div class="dad-denial-footer">' +
                                'DAD Insurance &mdash; Divers Accident Department<br>' +
                                '<span style="color:#555; font-size:10px;">"We\'re not your dad. But we also won\'t help you."</span>' +
                            '</div>' +
                        '</div>';
                    result.style.display = 'block';
                    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                });
            }
        }

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        renderStep();
        document.body.appendChild(overlay);
    }

    // ============================================================
    // 10. LIVE CONDITIONS REPORT (always terrible)
    // ============================================================
    function initConditionsReport() {
        var widget = document.getElementById('conditions-widget');
        if (!widget) return;

        var visEl = document.getElementById('cond-vis');
        var tempEl = document.getElementById('cond-temp');
        var wavesEl = document.getElementById('cond-waves');
        var currentEl = document.getElementById('cond-current');
        var ratingEl = document.getElementById('cond-rating');
        var verdictEl = document.getElementById('cond-verdict');
        var updatedEl = document.getElementById('cond-updated');
        var siteSelect = document.getElementById('conditions-site');

        var currentOptions = [
            'Strong', 'Ripping', 'Dangerous', 'Will take your fins',
            'Class 5 (don\'t)', 'Technical (we\'re not)', 'Surge + Panic'
        ];

        var verdicts = [
            'Hell No', 'Absolutely Not', 'Maybe Tomorrow (No)',
            'Dive at your own risk (don\'t)', 'Kelvin says no',
            'Conditions Marginal (he\'s being polite)',
            'Would Not Recommend', 'Check Back in July (it\'s January)',
            'Kelvin is eating lunch, ask later'
        ];

        var siteSpecificViz = {
            "Kyle's Backyard Pool": { min: 0.1, max: 0.8 },
            "The Puddle Behind the Gas Station": { min: 0.05, max: 0.3 },
            "Lake \"It's Probably Fine\"": { min: 0.3, max: 1.5 },
            "Public Beach #3 (Closed Since '19)": { min: 0.2, max: 1.0 },
            "The Deep End (1.5m)": { min: 0.4, max: 0.9 },
            "Flooded Quarry of Despair": { min: 0.1, max: 0.5 },
            "Municipal Drainage Ditch": { min: 0.02, max: 0.2 },
            "Uncle Jerry's Pond": { min: 0.3, max: 1.2 }
        };

        function randomRange(min, max) {
            return (Math.random() * (max - min) + min);
        }

        function getSiteKey(name) {
            for (var k in siteSpecificViz) {
                if (k === name) return k;
            }
            return "Kyle's Backyard Pool";
        }

        function updateConditions() {
            var site = siteSelect ? siteSelect.value : "Kyle's Backyard Pool";
            var vizKey = getSiteKey(site);
            var vizRange = siteSpecificViz[vizKey];

            var viz = randomRange(vizRange.min, vizRange.max);
            var temp = Math.round(randomRange(6, 16));
            var waves = randomRange(0.8, 3.5);

            var currentIdx = Math.floor(Math.random() * currentOptions.length);
            var verdictIdx = Math.floor(Math.random() * verdicts.length);

            if (visEl) visEl.textContent = viz.toFixed(1) + 'm';
            if (tempEl) tempEl.textContent = temp + '°C';
            if (wavesEl) wavesEl.textContent = waves.toFixed(1) + 'm';
            if (currentEl) currentEl.textContent = currentOptions[currentIdx];
            if (ratingEl) ratingEl.textContent = '★☆☆☆☆';
            if (verdictEl) verdictEl.textContent = verdicts[verdictIdx];

            var now = new Date();
            var timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            if (updatedEl) updatedEl.textContent = 'Last updated: ' + timeStr + ' — Conditions will not improve';
        }

        updateConditions();

        var _conditionsInterval = setInterval(updateConditions, 5000);

        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                clearInterval(_conditionsInterval);
                _conditionsInterval = null;
            } else {
                if (!_conditionsInterval) {
                    _conditionsInterval = setInterval(updateConditions, 5000);
                }
            }
        });

        if (siteSelect) {
            siteSelect.addEventListener('change', function() {
                updateConditions();
                if (updatedEl) updatedEl.textContent = 'Last updated: just now (site changed, conditions still bad)';
            });
        }
    }

    // ============================================================
    // 11. SHOP — ADD TO CART
    // ============================================================
    var cartCount = 0;

    function addToCart(btn) {
        cartCount++;
        var el = document.getElementById('shop-cart-count');
        if (el) el.textContent = '🛒 Cart (' + cartCount + ')';

        var notif = document.createElement('div');
        notif.className = 'shop-notification';
        var product = 'Item';
        if (btn) {
            var item = btn.closest('.shop-item');
            if (item) {
                var h3 = item.querySelector('h3');
                if (h3) product = h3.textContent;
            }
        }
        notif.textContent = '✅ Added to cart: ' + product;
        document.body.appendChild(notif);

        setTimeout(function() {
            notif.style.opacity = '0';
            notif.style.transition = 'opacity 0.3s';
            setTimeout(function() { notif.remove(); }, 300);
        }, 2000);
    };

    // ============================================================
    // 12. GALLERY — LIGHTBOX & FILTER
    // ============================================================
    function openGallery(el) {
        var caption = el.querySelector('.gallery-caption');
        var date = el.querySelector('.gallery-date');
        var modal = document.getElementById('gallery-modal');
        if (!modal) return;

        var bgEl = el.querySelector('.gallery-bg');
        var modalBg = document.getElementById('gallery-modal-bg');
        if (bgEl && modalBg) {
            var style = bgEl.getAttribute('style');
            if (style) {
                var match = style.match(/url\(['"]?([^'"]+)['"]?\)/);
                if (match) {
                    modalBg.style.backgroundImage = "url('" + match[1] + "')";
                } else {
                    modalBg.style.backgroundImage = 'none';
                    modalBg.style.background = 'var(--navy-primary)';
                }
            }
        } else {
            modalBg.style.backgroundImage = 'none';
            modalBg.style.background = 'var(--navy-primary)';
        }

        document.getElementById('gallery-modal-caption').textContent = caption ? caption.textContent : '';
        document.getElementById('gallery-modal-date').textContent = date ? date.textContent : '';
        modal.classList.add('show');
    };

    function closeGalleryModal() {
        var modal = document.getElementById('gallery-modal');
        if (modal) modal.classList.remove('show');
    };

    function filterGallery(filter, btn) {
        var items = document.querySelectorAll('.gallery-item');
        for (var i = 0; i < items.length; i++) {
            if (filter === 'all' || items[i].getAttribute('data-category') === filter) {
                items[i].style.display = '';
            } else {
                items[i].style.display = 'none';
            }
        }
        var filters = document.querySelectorAll('.gallery-filter');
        for (var f = 0; f < filters.length; f++) {
            filters[f].classList.remove('active');
        }
        if (btn) btn.classList.add('active');
    };

    // ============================================================
    // 13. BLOG — TOGGLE POSTS
    // ============================================================
    function toggleBlog(headerEl) {
        var post = headerEl.closest('.blog-post');
        if (post) {
            post.classList.toggle('expanded');
            var ind = post.querySelector('.blog-expand-indicator');
            if (ind) ind.textContent = post.classList.contains('expanded') ? '−' : '+';
        }
    };

    // ============================================================
    // 14. BLOG — NEWSLETTER SIGNUP
    // ============================================================
    function newsletterSignup() {
        var email = document.getElementById('newsletter-email');
        var result = document.getElementById('newsletter-result');
        if (!result) return false;

        var messages = [
            'Thanks! Your email has been added to our "definitely sending" list (we will not send anything).',
            'Subscribed! You will now receive 0 emails from us. Check your spam folder for nothing.',
            'Welcome aboard! Your first newsletter is coming "soon" (it has been "coming soon" since 2023).',
            'You\'re on the list! Our newsletter is currently in "development" (Kyle has an email draft from 2022 he hasn\'t finished).',
        ];
        var msg = messages[Math.floor(Math.random() * messages.length)];
        result.textContent = msg;

        if (email) email.value = '';
        return false;
    };

    // ============================================================
    // 15. ELEARNING — INFINITE LOADING SIMULATION
    // ============================================================
    function startELearning() {
        var playBtn = document.getElementById('elearning-play-btn');
        var videoArea = document.getElementById('elearning-video');
        var progressWrap = document.getElementById('elearning-progress-wrap');
        var progressFill = document.getElementById('elearning-progress-fill');
        var progressText = document.getElementById('elearning-progress-text');
        var progressEta = document.getElementById('elearning-progress-eta');
        var status = document.getElementById('elearning-status');

        if (playBtn) {
            playBtn.textContent = '⏳';
            playBtn.style.cursor = 'default';
            playBtn.onclick = null;
        }
        if (videoArea) {
            videoArea.style.background = '#000000';
        }
        if (progressWrap) progressWrap.style.display = 'block';
        if (status) status.textContent = 'Loading...';

        var progress = 0;
        var loadingMessages = [
            'Connecting to Kyle\'s laptop...',
            'Booting Windows 95 emulator...',
            'Downloading course from 2003...',
            'Buffering... (always buffering)',
            'Converting VHS to digital...',
            'Searching for instructor\'s notes (they\'re on a napkin)...',
            'Rendering 144p video...',
            'Verifying accreditation (this will take a while)...',
        ];

        function advanceLoading() {
            if (progress >= 98) {
                progress = 98;
            }

            var increment = Math.random() * 0.5 + 0.1;
            progress += increment;
            if (progress > 100) progress = 100;

            if (progressFill) progressFill.style.width = Math.floor(progress) + '%';
            if (progressText) progressText.textContent = 'Loading... ' + Math.floor(progress) + '%';

            var etaMessages = [
                'Estimated time remaining: ∞',
                'Estimated time remaining: 47 years',
                'Estimated time remaining: depends on your ISP',
                'Estimated time remaining: "soon"',
                'Estimated time remaining: whenever Kyle wakes up',
                'Estimated time remaining: never (but in a fun way)',
                'Estimated time remaining: undefined',
            ];
            if (progressEta) {
                progressEta.textContent = etaMessages[Math.floor(Math.random() * etaMessages.length)];
            }

            if (Math.random() < 0.15 && videoArea) {
                videoArea.innerHTML = '<div class="elearning-video-placeholder" style="color:#333; font-size:11px; padding:20px;">' +
                    loadingMessages[Math.floor(Math.random() * loadingMessages.length)] +
                    '</div>';
            }

            if (progress < 100) {
                setTimeout(advanceLoading, 1500 + Math.random() * 4000);
            } else {
                if (progressFill) progressFill.style.width = '99%';
                if (progressText) progressText.textContent = 'Loading... 99% (stuck here forever)';
                if (progressEta) progressEta.textContent = 'The course is stuck at 99%. This is intentional. It builds patience.';
                if (status) status.textContent = 'Stuck at 99%';
            }
        }

        setTimeout(advanceLoading, 500);

        var moduleIcons = document.querySelectorAll('.elearning-module .module-icon');
        for (var m = 0; m < moduleIcons.length; m++) {
            var mi = moduleIcons[m];
            if (m === 0) {
                mi.textContent = '⏳';
            } else {
                mi.textContent = '🔒';
                mi.parentElement.title = 'Complete previous module to unlock (you can\'t)';
            }
        }
    };

    // ============================================================
    // 16. COMPLAINTS — AUTO-REPLY
    // ============================================================
    function initComplaints() {
        var form = document.getElementById('complaint-form');
        if (!form) return;

        form.addEventListener('submit', function(e) {
            e.preventDefault();

            var name = document.getElementById('complaint-name').value.trim() || 'Valued Complainant';
            var category = document.getElementById('complaint-category').value;
            var resolution = document.getElementById('complaint-resolution').value;
            var result = document.getElementById('complaint-result');
            if (!result) return;

            var responseMessages = [
                'Thank you for your complaint. It has been logged in our system (it has not). Our team will review it (they won\'t) and get back to you (no).',
                'We appreciate you taking the time to share your concerns. Your feedback is important to us (this is a lie). We have noted your issue and filed it appropriately (the trash).',
                'Dear ' + name + ', thank you for contacting PODI Complaints. Your complaint regarding "' + category + '" has been received and assigned to our "Circular File" department. Response time: never.',
                'COMPLAINT RECEIVED. Reference #: DNGAF-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '. Please allow 6-8 never for a response. Your desired resolution of "' + resolution + '" has been noted and denied.',
                'Thank you, ' + name + '. Your complaint has been carefully read and promptly ignored. We wish you the best of luck with your unresolved issue. Have a day!',
            ];

            var msg = responseMessages[Math.floor(Math.random() * responseMessages.length)];

            result.innerHTML =
                '<div class="complaint-result-card">' +
                    '<div class="complaint-result-icon">📨</div>' +
                    '<div class="complaint-result-header">Complaint "Processed"</div>' +
                    '<div class="complaint-result-body">' + msg + '</div>' +
                    '<div class="complaint-result-footer">This response was generated by an autoresponder. The autoresponder is a rubber stamp that says "DENIED."</div>' +
                '</div>';

            form.reset();
            result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }

    // ============================================================
    // 17. CHARTER BOOKING
    // ============================================================
    function charterBooking() {
        var form = document.getElementById('charter-form');
        if (!form) return false;
        var name = document.getElementById('charter-name');
        var email = document.getElementById('charter-email');
        var result = document.getElementById('charter-result');
        if (result) {
            result.innerHTML = '<div class="charter-result-card">' +
                '<div class="charter-result-icon">📋</div>' +
                '<div class="charter-result-header">Booking "Request" Received</div>' +
                '<div class="charter-result-body">Thank you, ' + (name ? name.value : 'Valued Diver') + '! Your charter request has been "logged." We will "review" it and "get back to you." These quotes are doing a lot of work.</div>' +
                '<div class="charter-result-footer">Fun fact: No PODI charter has ever actually departed. But we keep taking bookings!</div>' +
            '</div>';
        }
        if (form) form.reset();
        if (result) result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return false;
    }

    // ============================================================
    // BUDDY TINDER
    // ============================================================
    var buddyData = [
        {
            name: 'Kyle McSplash',
            cert: 'PODI Founder & "Lead Instructor" (self-appointed)',
            attitude: '"I don\'t need a lesson plan. I have vibes. The ocean is my classroom. Liability is my hobby."',
            redFlags: ['Has never used a dive computer ("I feel the depth, bro")', 'Owns a fin, singular', 'Certified himself overnight', 'Refers to the bends as "the tingle"'],
            img: 'images/buddy-1.jpg',
            color: '#ff6600'
        },
        {
            name: 'Gary M.',
            cert: 'PODI Open Water "Graduate" (currently in physio)',
            attitude: '"They said diving was safe. I said hold my beer. That was 47 dives and 2 hospital visits ago."',
            redFlags: ['Still wears the rental gear he never returned', 'Equalizes by sneezing', 'Thinks "NDL" stands for "No Diving Left"', 'His dive log is just ambulance receipts'],
            img: 'images/buddy-2.jpg',
            color: '#cc4400'
        },
        {
            name: 'Tiffany',
            cert: 'Instagram Diver — 50 dives, 500 posts',
            attitude: '"I\'ve done 50 dives and have 500 photos. I\'ve seen maybe 3 of the dives. The 构图 was important."',
            redFlags: ['GoPro glued to hand at all times', 'Has never looked at her air gauge ("it ruins the aesthetic")', 'Asks the divemaster to "reshoot that" on the surface', 'Her buoyancy is controlled by social engagement metrics'],
            img: 'images/buddy-3.jpg',
            color: '#ff66aa'
        },
        {
            name: 'Dave T.',
            cert: 'Master Diver (of his couch — PODI Online)',
            attitude: '"I completed the entire course without getting wet. That\'s efficiency. Why would I need to be in water to learn about water?"',
            redFlags: ['Has never actually been underwater', 'Owns full tech kit — still in boxes', 'Gives diving advice on forums', 'His "dive computer" is a Casio watch'],
            img: 'images/buddy-4.jpg',
            color: '#22cccc'
        },
        {
            name: 'Karen L.',
            cert: 'Advanced Open Water (she can\'t equalize)',
            attitude: '"I paid for this dive and I\'m GOING DOWN. My sinuses will just have to deal with it."',
            redFlags: ['Thinks equalizing is "optional"', 'Has asked for managers on 3 different dive boats', 'Blames her mask for everything', 'Refuses to do a pre-dive check ("I know what I\'m doing")'],
            img: 'images/buddy-5.jpg',
            color: '#e74c3c'
        },
        {
            name: 'Kevin',
            cert: 'PODI "Conditions Reporter" — found a thermometer once',
            attitude: '"I\'m basically a marine meteorologist. I looked at the water. I touched it. It felt wet. That\'s data."',
            redFlags: ['His "visibility assessment" is squinting', 'Uses a pool thermometer from Walmart', 'Readings are 100% vibes-based', 'Has never been past knee-deep'],
            img: 'images/buddy-6.jpg',
            color: '#00a86b'
        },
        {
            name: 'Brenda',
            cert: 'Bought gear once, never dove, still shows up',
            attitude: '"I invested $3,000 in this equipment. I\'m GOING to use it. Eventually. Today might not be the day, but I\'ll be poolside for morale support."',
            redFlags: ['Gear still has tags on', 'Shows up to every boat but "forgets" her cert card', 'Offers unsolicited advice from YouTube videos', 'Has logged 0 dives but 47 boat trips'],
            img: 'images/buddy-7.jpg',
            color: '#9966ff'
        },
        {
            name: 'Steve',
            cert: 'Claims 2,000 dives, all in the same flooded quarry',
            attitude: '"It\'s the best diving in the world if you know where to look. No, I won\'t tell you where. You have to earn it."',
            redFlags: ['Has only ever dived one location', 'Refuses to dive anywhere else ("too dangerous")', 'Keeps a "quarry log" with 2,000 identical entries', 'Thinks viz of 0.5m is "crystal clear"'],
            img: 'images/buddy-8.jpg',
            color: '#4488aa'
        },
        {
            name: 'Linda',
            cert: 'Navy SEAL (she watched a documentary series)',
            attitude: '"I basically have special forces training. I\'ve seen all 8 seasons of SEAL Team. The tactics are the same underwater."',
            redFlags: ['Thinks military experience is "transferable"', 'Tried to do a tactical roll entry off a zodiac', 'Refers to her BCD as "my tactical vest"', 'Has never actually been in the ocean'],
            img: 'images/buddy-9.jpg',
            color: '#557744'
        },
        {
            name: 'Chad',
            cert: 'Free Diving Instructor (teaching Scuba)',
            attitude: '"Scuba is just free diving with training wheels. The air tank is a crutch. Real divers hold their breath. I\'ll teach you."',
            redFlags: ['Doesn\'t believe in decompression stops', 'Actively discourages breathing ("it builds character")', 'Has bent 3 students this month alone', 'His emergency plan is "ascend with authority"'],
            img: 'images/buddy-10.jpg',
            color: '#ffcc00'
        },
        {
            name: 'Muriel',
            cert: 'PADI... wait, PODI Open Water — certified last week at age 85',
            attitude: '"I told the instructor I want to see the pretty fishies. He said I\'d need a medical form. I told him I outlived my doctor."',
            redFlags: ['50/50 chance of having dentures fall out during regulator use', 'Medication list is longer than her dive plan', 'Thinks "safety stop" means checking her blood pressure', 'Out-swims everyone in the family'],
            img: 'images/buddy-11.jpg',
            color: '#ff88aa'
        },
        {
            name: 'Rescue Randy (Mannequin)',
            cert: 'PODI Divemaster — 100% of dives survived',
            attitude: '"..." — Randy communicates through silent judgment and impeccable buoyancy. Literally cannot drown.',
            redFlags: ['Is a mannequin', 'Has been certified as Divemaster, Instructor, and Course Director', 'Somehow has more dive experience than Kyle', 'Will judge you silently throughout the entire dive'],
            img: 'images/buddy-12.jpg',
            color: '#888888'
        }
    ];

    function generateDiverSVG(color) {
        var hex = color || '#ff6600';
        var r = parseInt(hex.slice(1,3), 16);
        var g = parseInt(hex.slice(3,5), 16);
        var b = parseInt(hex.slice(5,7), 16);
        var dark = 'rgb(' + Math.round(r*0.5) + ',' + Math.round(g*0.5) + ',' + Math.round(b*0.5) + ')';
        var light = 'rgb(' + Math.min(255,r+80) + ',' + Math.min(255,g+80) + ',' + Math.min(255,b+80) + ')';
        var bg = 'rgb(' + r + ',' + g + ',' + b + ')';
        return 'data:image/svg+xml,' + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
            '<rect width="200" height="200" fill="#0a1628"/>' +
            '<ellipse cx="100" cy="100" rx="90" ry="90" fill="' + dark + '" opacity="0.15"/>' +
            '<ellipse cx="100" cy="80" rx="40" ry="45" fill="' + light + '" opacity="0.3"/>' +
            '<ellipse cx="100" cy="80" rx="38" ry="42" fill="' + bg + '"/>' +
            '<rect x="62" y="58" width="76" height="30" rx="8" fill="#222"/>' +
            '<rect x="68" y="60" width="64" height="26" rx="6" fill="#333"/>' +
            '<ellipse cx="82" cy="73" rx="8" ry="6" fill="#1a1a2e" opacity="0.8"/>' +
            '<ellipse cx="118" cy="73" rx="8" ry="6" fill="#1a1a2e" opacity="0.8"/>' +
            '<rect x="72" y="86" width="56" height="14" rx="4" fill="#222"/>' +
            '<rect x="78" y="88" width="44" height="10" rx="3" fill="#555"/>' +
            '<rect x="84" y="90" width="32" height="6" rx="2" fill="#777"/>' +
            '<ellipse cx="100" cy="105" rx="20" ry="8" fill="#444"/>' +
            '<rect x="88" y="95" width="24" height="3" rx="1" fill="#aaa"/>' +
            '<polygon points="96,100 104,100 108,110 92,110" fill="#666"/>' +
            '<polygon points="92,110 108,110 106,118 94,118" fill="#888"/>' +
            '<path d="M108 98 Q130 95 140 100 Q150 105 148 115 Q145 125 135 122 Q130 118 120 105Z" fill="#bbb" opacity="0.5"/>' +
            '<circle cx="60" cy="50" r="3" fill="none" stroke="#fff" stroke-width="1" opacity="0.3"/>' +
            '<circle cx="50" cy="65" r="2" fill="none" stroke="#fff" stroke-width="1" opacity="0.2"/>' +
            '<circle cx="140" cy="45" r="4" fill="none" stroke="#fff" stroke-width="1" opacity="0.3"/>' +
            '<circle cx="150" cy="60" r="2" fill="none" stroke="#fff" stroke-width="1" opacity="0.2"/>' +
            '<circle cx="145" cy="70" r="3" fill="none" stroke="#fff" stroke-width="1" opacity="0.15"/>' +
            '<circle cx="55" cy="40" r="2" fill="none" stroke="#fff" stroke-width="1" opacity="0.2"/>' +
            '</svg>'
        );
    }

    function initBuddyTinder() {
        var cardWrap = document.getElementById('tinder-card-wrap');
        if (!cardWrap) return;

        var card = document.getElementById('tinder-card');
        var face = document.getElementById('tinder-card-face');
        var emptyEl = document.getElementById('tinder-empty');
        var matchesSection = document.getElementById('buddy-matches-section');
        var matchesGrid = document.getElementById('buddy-matches-grid');
        var remainingEl = document.getElementById('buddy-remaining');
        var matchedEl = document.getElementById('buddy-matched');
        var passedEl = document.getElementById('buddy-passed');
        var btnNope = document.getElementById('btn-nope');
        var btnMatch = document.getElementById('btn-match');
        var btnReset = document.getElementById('btn-reset');
        var btnClear = document.getElementById('btn-clear-matches');

        var matched = JSON.parse(localStorage.getItem('podiBuddyMatches') || '[]');
        var passed = JSON.parse(localStorage.getItem('podiBuddyPassed') || '[]');
        var currentIndex = 0;
        var isAnimating = false;
        var startX = 0;
        var startY = 0;
        var isDragging = false;

        function getRemaining() {
            return buddyData.filter(function(b, i) {
                return matched.indexOf(i) === -1 && passed.indexOf(i) === -1;
            });
        }

        function updateStats() {
            var remaining = getRemaining();
            if (remainingEl) remainingEl.textContent = remaining.length;
            if (matchedEl) matchedEl.textContent = matched.length;
            if (passedEl) passedEl.textContent = passed.length;
        }

        function showBuddy(index) {
            if (!card || !emptyEl) return;
            var remaining = getRemaining();
            if (index >= remaining.length) {
                card.style.display = 'none';
                emptyEl.style.display = 'flex';
                updateStats();
                return;
            }
            emptyEl.style.display = 'none';
            card.style.display = 'flex';
            card.className = 'tinder-card';
            card.style.transform = '';
            card.style.opacity = '';
            card.style.transition = '';

            var buddy = remaining[index];
            var emojiEl = document.getElementById('buddy-emoji');
            if (buddy.img) {
                emojiEl.innerHTML = '<img src="' + buddy.img + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">';
                emojiEl.style.background = 'transparent';
            } else {
                emojiEl.innerHTML = '';
                emojiEl.style.background = buddy.color || '#ff6600';
                emojiEl.style.backgroundImage = 'url(' + generateDiverSVG(buddy.color) + ')';
                emojiEl.style.backgroundSize = 'cover';
                emojiEl.style.backgroundPosition = 'center';
            }
            document.getElementById('buddy-name').textContent = buddy.name;
            document.getElementById('buddy-cert').textContent = buddy.cert;
            document.getElementById('buddy-attitude').textContent = buddy.attitude;
            var ul = document.getElementById('buddy-redflags');
            ul.innerHTML = '';
            buddy.redFlags.forEach(function(flag) {
                var li = document.createElement('li');
                li.textContent = flag;
                ul.appendChild(li);
            });
            updateStats();
        }

        function swipeBuddy(direction) {
            if (isAnimating || !card) return;
            var remaining = getRemaining();
            if (currentIndex >= remaining.length) return;
            isAnimating = true;

            var originalIndex = buddyData.indexOf(remaining[currentIndex]);

            if (direction === 'right') {
                card.classList.add('swipe-right');
                if (matched.indexOf(originalIndex) === -1) {
                    matched.push(originalIndex);
                    localStorage.setItem('podiBuddyMatches', JSON.stringify(matched));
                }
            } else {
                card.classList.add('swipe-left');
                if (passed.indexOf(originalIndex) === -1) {
                    passed.push(originalIndex);
                    localStorage.setItem('podiBuddyPassed', JSON.stringify(passed));
                }
            }

            setTimeout(function() {
                currentIndex++;
                showBuddy(currentIndex);
                isAnimating = false;
                renderMatches();
            }, 300);
        }

        function renderMatches() {
            if (!matchesSection || !matchesGrid) return;
            if (matched.length === 0) {
                matchesSection.style.display = 'none';
                return;
            }
            matchesSection.style.display = 'block';
            matchesGrid.innerHTML = '';
            matched.forEach(function(idx) {
                var b = buddyData[idx];
                if (!b) return;
                var d = new Date();
                var dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                var div = document.createElement('div');
                div.className = 'buddy-match-card';
                var matchImg = b.img || generateDiverSVG(b.color);
                div.innerHTML =
                    '<span class="buddy-match-emoji" style="display:inline-block;width:60px;height:60px;border-radius:50%;background-image:url(' + matchImg + ');background-size:cover;background-position:center;background-color:' + (b.color || '#333') + ';border:2px solid rgba(255,255,255,0.1);"></span>' +
                    '<span class="buddy-match-name">' + b.name + '</span>' +
                    '<span class="buddy-match-cert">' + b.cert + '</span>' +
                    '<span class="buddy-match-date">Matched ' + dateStr + '</span>';
                matchesGrid.appendChild(div);
            });
        }

        function resetAll() {
            localStorage.removeItem('podiBuddyMatches');
            localStorage.removeItem('podiBuddyPassed');
            matched = [];
            passed = [];
            currentIndex = 0;
            if (card) {
                card.style.display = 'flex';
                card.className = 'tinder-card';
                card.style.transform = '';
                card.style.opacity = '';
            }
            showBuddy(0);
            renderMatches();
            updateStats();
        }

        function clearMatches() {
            localStorage.removeItem('podiBuddyMatches');
            matched = [];
            renderMatches();
            updateStats();
        }

        // Mouse/touch drag handling
        function onPointerDown(e) {
            if (isAnimating) return;
            var remaining = getRemaining();
            if (currentIndex >= remaining.length) return;
            isDragging = true;
            card.classList.add('swiping');
            var point = e.type.indexOf('touch') !== -1 ? e.touches[0] : e;
            startX = point.clientX;
            startY = point.clientY;
        }

        function onPointerMove(e) {
            if (!isDragging || !card) return;
            var point = e.type.indexOf('touch') !== -1 ? e.touches[0] : e;
            var dx = point.clientX - startX;
            var dy = point.clientY - startY;
            var rot = dx * 0.1;
            var opacity = 1 - Math.abs(dx) / 300;
            if (opacity < 0) opacity = 0;
            card.style.transform = 'translateX(' + dx + 'px) translateY(' + dy * 0.3 + 'px) rotate(' + rot + 'deg)';
            card.style.opacity = opacity;
            card.style.transition = 'none';

            var badges = card.querySelector('.tinder-card-badges');
            if (badges) {
                if (dx > 50) {
                    badges.style.opacity = Math.min(1, (dx - 50) / 100);
                    badges.querySelector('.tinder-heart').style.display = '';
                    badges.querySelector('.tinder-x').style.display = 'none';
                } else if (dx < -50) {
                    badges.style.opacity = Math.min(1, (-dx - 50) / 100);
                    badges.querySelector('.tinder-x').style.display = '';
                    badges.querySelector('.tinder-heart').style.display = 'none';
                } else {
                    badges.style.opacity = 0;
                }
            }
        }

        function onPointerUp(e) {
            if (!isDragging || !card) return;
            isDragging = false;
            card.classList.remove('swiping');
            var badges = card.querySelector('.tinder-card-badges');
            if (badges) badges.style.opacity = 0;

            var transform = card.style.transform;
            var match = transform.match(/translateX\(([-\d.]+)px\)/);
            if (!match) {
                card.style.transform = '';
                card.style.opacity = '';
                card.style.transition = '';
                return;
            }
            var dx = parseFloat(match[1]);

            if (dx > 100) {
                swipeBuddy('right');
            } else if (dx < -100) {
                swipeBuddy('left');
            } else {
                card.style.transform = '';
                card.style.opacity = '';
                card.style.transition = '';
            }
        }

        // Event listeners
        if (card) {
            card.addEventListener('mousedown', onPointerDown);
            document.addEventListener('mousemove', onPointerMove);
            document.addEventListener('mouseup', onPointerUp);
            card.addEventListener('touchstart', onPointerDown, { passive: true });
            document.addEventListener('touchmove', onPointerMove, { passive: true });
            document.addEventListener('touchend', onPointerUp);
        }

        if (btnNope) btnNope.addEventListener('click', function() { swipeBuddy('left'); });
        if (btnMatch) btnMatch.addEventListener('click', function() { swipeBuddy('right'); });
        if (btnReset) btnReset.addEventListener('click', resetAll);
        if (btnClear) btnClear.addEventListener('click', clearMatches);

        // Keyboard support
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') swipeBuddy('left');
            if (e.key === 'ArrowRight') swipeBuddy('right');
        });

        // Init
        showBuddy(0);
        renderMatches();
    }

    // ============================================================
    // 18. ACHIEVEMENT BADGES — EXTREME GAMIFICATION ENGINE
    // ============================================================
    var badgeSystem = {
        badges: [
            {
                id: 'bent-at-10m',
                name: 'Bent at 10m',
                icon: '\u{1F9B4}',
                description: 'Hit exactly 10m on the PODI Dive Computer. The bends start at home.',
                flavor: 'Your bones are premium now. Walking is for amateurs.',
                rarity: 'RARE',
                color: '#ff6600',
                condition: function() {
                    return diveComputer.depth === 10;
                }
            },
            {
                id: 'lost-a-fin',
                name: 'Lost a Fin',
                icon: '\u{1F9B6}',
                description: 'Clicked 10 times in sheer panic. That fin is gone forever.',
                flavor: 'One fin = one speed. Panic speed. Hope you practiced your one-legged kick.',
                rarity: 'UNCOMMON',
                color: '#00ccff',
                condition: function() {
                    return badgeSystem._clickCount >= 10;
                }
            },
            {
                id: 'hundred-percent-narcd',
                name: '100% Narc\'d',
                icon: '\u{1F92A}',
                description: 'Hit zero NDL on the PODI Dive Computer. You are chemically one with the ocean.',
                flavor: 'What\'s your name? Who\'s Kyle? Is that fish talking? Why is the water breathing ME?',
                rarity: 'EPIC',
                color: '#ff00ff',
                condition: function() {
                    return diveComputer.running && diveComputer.ndl <= 0 && diveComputer.decoLocked;
                }
            }
        ],
        _unlocked: {},
        _clickCount: 0,
        _checkInterval: null,
        _initialized: false,

        init: function() {
            if (this._initialized) return;
            this._initialized = true;
            this.load();
            this.createPanel();
            this.createButton();
            this.startChecking();
            this.trackClicks();
            console.log('%c\u{1F3C6} BADGE SYSTEM ARMED', 'color: #ffcc00; font-size: 14px; font-weight: bold');
        },

        load: function() {
            try {
                var data = JSON.parse(localStorage.getItem('podi_badges') || '{}');
                this._unlocked = data;
            } catch(e) {
                this._unlocked = {};
            }
        },

        save: function() {
            localStorage.setItem('podi_badges', JSON.stringify(this._unlocked));
        },

        isUnlocked: function(id) {
            return !!this._unlocked[id];
        },

        trackClicks: function() {
            var self = this;
            document.addEventListener('click', function() {
                self._clickCount++;
            });
        },

        startChecking: function() {
            var self = this;
            this._checkInterval = setInterval(function() {
                for (var i = 0; i < self.badges.length; i++) {
                    var badge = self.badges[i];
                    if (!self.isUnlocked(badge.id)) {
                        try {
                            if (badge.condition()) {
                                self.unlock(badge);
                            }
                        } catch(e) {}
                    }
                }
            }, 500);
        },

        unlock: function(badge) {
            if (this.isUnlocked(badge.id)) return;

            this._unlocked[badge.id] = {
                unlockedAt: new Date().toISOString(),
                name: badge.name,
                icon: badge.icon
            };
            this.save();
            this.updatePanel();
            this.celebrate(badge);
        },

        celebrate: function(badge) {
            this.playFanfare();
            this.showModal(badge);
            this.spawnConfetti();
            this.shakeScreen();
        },

        playFanfare: function() {
            try {
                var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                var notes = [523.25, 659.25, 783.99, 1046.50];

                for (var n = 0; n < notes.length; n++) {
                    var freq = notes[n];
                    var osc = audioCtx.createOscillator();
                    var gain = audioCtx.createGain();
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.frequency.value = freq;
                    osc.type = 'square';
                    gain.gain.setValueAtTime(0.25, audioCtx.currentTime + n * 0.15);
                    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + n * 0.15 + 0.4);
                    osc.start(audioCtx.currentTime + n * 0.15);
                    osc.stop(audioCtx.currentTime + n * 0.15 + 0.4);
                }

                var osc2 = audioCtx.createOscillator();
                var gain2 = audioCtx.createGain();
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.frequency.value = 261.63;
                osc2.type = 'sawtooth';
                gain2.gain.setValueAtTime(0.12, audioCtx.currentTime + 0.55);
                gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
                osc2.start(audioCtx.currentTime + 0.55);
                osc2.stop(audioCtx.currentTime + 1.2);
            } catch(e) {}
        },

        showModal: function(badge) {
            var existing = document.getElementById('badge-modal');
            if (existing) existing.remove();

            var overlay = document.createElement('div');
            overlay.id = 'badge-modal';
            overlay.className = 'badge-overlay';

            overlay.innerHTML =
                '<div class="badge-modal">' +
                    '<div class="badge-modal-sparkle">\u2726</div>' +
                    '<div class="badge-modal-label">ACHIEVEMENT UNLOCKED</div>' +
                    '<div class="badge-modal-icon">' + badge.icon + '</div>' +
                    '<div class="badge-modal-name" style="color:' + badge.color + '">' + badge.name + '</div>' +
                    '<div class="badge-modal-desc">' + badge.description + '</div>' +
                    '<div class="badge-modal-flavor">\u201C' + badge.flavor + '\u201D</div>' +
                    '<div class="badge-modal-rarity" style="background:' + badge.color + '">\u2605 ' + badge.rarity + ' \u2605</div>' +
                    '<button class="badge-modal-btn" id="badge-modal-ok">HELL YEAH</button>' +
                '</div>';

            document.body.appendChild(overlay);

            var self = this;
            var okBtn = document.getElementById('badge-modal-ok');
            if (okBtn) {
                okBtn.addEventListener('click', function() {
                    overlay.style.opacity = '0';
                    overlay.style.transition = 'opacity 0.5s';
                    setTimeout(function() {
                        if (overlay.parentNode) overlay.remove();
                        self.vibrateVictory();
                    }, 500);
                });
            }
        },

        spawnConfetti: function() {
            var container = document.getElementById('badge-confetti');
            if (container) container.remove();

            container = document.createElement('div');
            container.id = 'badge-confetti';
            container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:99999;overflow:hidden;';
            document.body.appendChild(container);

            var colors = ['#ff6600','#ffcc00','#00ff00','#00ccff','#ff00ff','#ff3333','#ffffff','#ff9900','#66ff66'];

            for (var i = 0; i < 120; i++) {
                var piece = document.createElement('div');
                var size = 5 + Math.random() * 10;
                var color = colors[Math.floor(Math.random() * colors.length)];
                var left = Math.random() * 100;
                var delay = Math.random() * 2;
                var duration = 1.5 + Math.random() * 2.5;
                var isCircle = Math.random() > 0.5;

                piece.style.cssText =
                    'position:absolute;top:-20px;left:' + left + '%;' +
                    'width:' + size + 'px;height:' + size + 'px;' +
                    'background:' + color + ';' +
                    'border-radius:' + (isCircle ? '50%' : '2px') + ';' +
                    'animation:badge-confetti-fall ' + duration + 's ease-out ' + delay + 's forwards;' +
                    'opacity:0;';
                container.appendChild(piece);
            }

            setTimeout(function() {
                if (container.parentNode) container.remove();
            }, 6000);
        },

        shakeScreen: function() {
            var intensity = 6;
            var duration = 600;
            var start = Date.now();
            var origTransform = document.body.style.transform || '';

            function doShake() {
                var elapsed = Date.now() - start;
                if (elapsed >= duration) {
                    document.body.style.transform = origTransform;
                    return;
                }
                var decay = 1 - elapsed / duration;
                var x = (Math.random() * 2 - 1) * intensity * decay;
                var y = (Math.random() * 2 - 1) * intensity * decay;
                document.body.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
                requestAnimationFrame(doShake);
            }
            doShake();
        },

        vibrateVictory: function() {
            if (navigator.vibrate) {
                navigator.vibrate([50, 30, 50, 30, 100, 50, 200]);
            }
        },

        createPanel: function() {
            if (document.getElementById('badge-panel')) return;

            var panel = document.createElement('div');
            panel.id = 'badge-panel';
            panel.className = 'badge-panel';

            panel.innerHTML =
                '<div class="badge-panel-header">' +
                    '<span class="badge-panel-title">\u{1F3C6} ACHIEVEMENTS</span>' +
                    '<span class="badge-panel-close" id="badge-panel-close">\u2715</span>' +
                '</div>' +
                '<div class="badge-panel-body" id="badge-panel-body"></div>';

            document.body.appendChild(panel);

            var closeBtn = document.getElementById('badge-panel-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', function() {
                    panel.classList.remove('badge-panel-open');
                });
            }

            this.updatePanel();
        },

        createButton: function() {
            if (document.getElementById('badge-toggle-btn')) return;

            var btn = document.createElement('div');
            btn.id = 'badge-toggle-btn';
            btn.className = 'badge-toggle-btn';
            btn.textContent = '\u{1F3C6}';
            btn.title = 'View Achievements';

            var self = this;
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var panel = document.getElementById('badge-panel');
                if (panel) {
                    panel.classList.toggle('badge-panel-open');
                }
            });

            document.body.appendChild(btn);
        },

        updatePanel: function() {
            var body = document.getElementById('badge-panel-body');
            if (!body) return;

            var unlockedCount = 0;
            for (var key in this._unlocked) {
                if (this._unlocked.hasOwnProperty(key)) unlockedCount++;
            }

            var html = '<div class="badge-panel-stats">' +
                '<span class="badge-panel-count">' + unlockedCount + ' / ' + this.badges.length + ' UNLOCKED</span>' +
                '</div>';

            html += '<div class="badge-panel-grid">';

            for (var i = 0; i < this.badges.length; i++) {
                var b = this.badges[i];
                var unlocked = this.isUnlocked(b.id);
                var data = this._unlocked[b.id];
                var dateStr = '';
                if (data && data.unlockedAt) {
                    try {
                        var d = new Date(data.unlockedAt);
                        dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                    } catch(e) {
                        dateStr = '';
                    }
                }

                html += '<div class="badge-panel-item ' + (unlocked ? 'badge-unlocked' : 'badge-locked') + '">' +
                    '<div class="badge-item-icon"' + (unlocked ? '' : ' style="filter:grayscale(1);opacity:0.25;"') + '>' + b.icon + '</div>' +
                    '<div class="badge-item-name">' + b.name + '</div>' +
                    '<div class="badge-item-rarity" style="color:' + (unlocked ? b.color : '#555') + '">' + b.rarity + '</div>';

                if (unlocked) {
                    html += '<div class="badge-item-date">\u{1F4C5} ' + dateStr + '</div>';
                } else {
                    html += '<div class="badge-item-locked-text">\u{1F512}</div>';
                }

                html += '</div>';
            }

            html += '</div>';
            body.innerHTML = html;
        }
    };

    // ============================================================
    // 19. REFER-A-FRIEND PROGRAM
    // ============================================================
    var referralData = {
        victims: [
            { name: 'Dave T.', injury: 'Pulled hamstring (panicked fin kick)', rating: 4, quote: 'They said I\'d be a "simulated casualty." I was not simulated. I was very actual.' },
            { name: 'Karen L.', injury: 'Bruised ego (instructor was better at arguing)', rating: 2, quote: 'I asked to speak to the manager of the rescue. They said I WAS the rescue.' },
            { name: 'Chad Thunderson', injury: 'Swallowed 3L of pool water ("attitude adjustment")', rating: 5, quote: 'Bro, I\'ve never been more alive. The instructor literally tried to drown me. 10/10.' },
            { name: 'Tiffany Reef', injury: 'GoPro flooded (tears were saltier than the ocean)', rating: 3, quote: 'I got 0 good shots. The instructor kept blocking my angles with his "rescue techniques."' },
            { name: 'Gary M.', injury: 'Existing back injury aggravated (he signed for it)', rating: 1, quote: 'I\'ve been in physio for 6 months. They said the rescue course was 2 days.' },
            { name: 'Bubbles McFloat', injury: 'Mannequin dignity violated', rating: 5, quote: '...' },
            { name: 'Muriel', injury: 'Lost her dentures during rescue breathers', rating: 4, quote: 'I\'m 85. I\'ve outlived my doctor. I can outlast a rescue course.' },
            { name: 'Brenda Wave', injury: 'Emotional damage from being treated like a victim', rating: 3, quote: 'I\'ve been in therapy ever since. The instructor said "that\'s not in the curriculum."' },
            { name: 'Rescue Randy', injury: 'None. He\'s a mannequin. He\'s fine.', rating: 5, quote: '... (superior silence)' },
            { name: 'Steve', injury: 'Refused to participate ("I\'ve done 2,000 dives")', rating: 1, quote: 'I\'ve been diving quarries for 20 years. No one "rescues" me. I was asked to leave.' },
        ],
        milestoneMessages: [
            'That\'s 1 buddy sold out for a discount! Nice work.',
            '2 victims! You\'re building a reputation. A bad one, but a reputation.',
            '3 referrals! You\'re officially a talent scout for the emotionally unprepared.',
            '4 buddies! At this point they should be paying YOU.',
            '5 referrals! You\'ve single-handedly kept our waiver printer running.',
            '6 victims! The Coast Guard has a file on you now.',
            '7 friends referred! You\'re running out of people who trust you.',
            '8 down! Your Christmas card list is getting shorter.',
            '9 referrals! Our instructor is requesting you specifically for "quality victims."',
            '10 VICTIMS! You\'ve earned the title "Serial Referrer." We\'re printing a special certificate.'
        ],
        discountMilestones: [
            { count: 1, discount: 10, label: '1 Buddy — 10% Off' },
            { count: 3, discount: 15, label: '3 Buddies — 15% Off' },
            { count: 5, discount: 20, label: '5 Buddies — 20% Off' },
            { count: 10, discount: 30, label: '10 Buddies — 30% Off (Executive Predator)' },
        ]
    };

    function initReferralProgram() {
        var genBtn = document.getElementById('referral-generate');
        var codeEl = document.getElementById('referral-code');
        var copyBtn = document.getElementById('referral-copy-btn');
        var copyMsg = document.getElementById('referral-copy-msg');
        var shareLinkBtn = document.getElementById('referral-share-link');
        var shareEmailBtn = document.getElementById('referral-share-email');
        var statsEl = document.getElementById('referral-stats');
        var victimListEl = document.getElementById('referral-victim-list');
        var milestonesEl = document.getElementById('referral-milestones');

        if (!codeEl) return;

        var savedCode = localStorage.getItem('podi_referral_code');
        var savedCount = parseInt(localStorage.getItem('podi_referral_count') || '0');
        var savedVictims = JSON.parse(localStorage.getItem('podi_referral_victims') || '[]');

        var victimNames = {};
        for (var v = 0; v < referralData.victims.length; v++) {
            victimNames[referralData.victims[v].name] = referralData.victims[v];
        }

        function generateCode() {
            var prefix = 'PODI-REF-';
            var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            var code = prefix;
            for (var i = 0; i < 6; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return code;
        }

        function getOrCreateCode() {
            if (!savedCode) {
                savedCode = generateCode();
                localStorage.setItem('podi_referral_code', savedCode);
            }
            return savedCode;
        }

        function getMilestoneForCount(count) {
            var ms = null;
            for (var m = 0; m < referralData.discountMilestones.length; m++) {
                if (count >= referralData.discountMilestones[m].count) {
                    ms = referralData.discountMilestones[m];
                }
            }
            return ms;
        }

        function getRandomVictim() {
            return referralData.victims[Math.floor(Math.random() * referralData.victims.length)];
        }

        function addFakeVictim() {
            var newVictim = getRandomVictim();
            if (savedVictims.length < referralData.victims.length) {
                while (savedVictims.indexOf(newVictim.name) !== -1) {
                    newVictim = getRandomVictim();
                }
                savedVictims.push(newVictim.name);
            } else {
                savedVictims.push(newVictim.name + ' (repeat victim — they didn\'t learn)');
            }
            localStorage.setItem('podi_referral_victims', JSON.stringify(savedVictims));
            return newVictim;
        }

        function getCopyJokes() {
            var jokes = [
                'Code copied! Your friend is now a "candidate." They\'ll thank you later. (They won\'t.)',
                '✓ Copied! Their rescue is now your discount. Fair trade.',
                'Code saved! Your buddy\'s rib cage is about to get "hands-on experience."',
                'Copied! Remember: a good referral is one who doesn\'t read the fine print.',
                'Code captured! Your friend thinks you\'re helping them. Adorable.',
                '✓ Copied! The instructor has been notified. Your buddy hasn\'t. Surprise!',
                'Nice! Your social circle is now a recruitment pipeline.',
                'Copied! Every referral brings you one step closer to "person of interest" status.',
                'Code saved! Your buddy will emerge from the course with new skills and old trauma.',
                '✓ You now have a referral code. Use it wisely. Use it on people who trust you.',
            ];
            return jokes[Math.floor(Math.random() * jokes.length)];
        }

        function getNewCodeJoke() {
            var jokes = [
                '🔄 New code, same mission: find fresh victims.',
                'Code regenerated! Your old one expired. Your friends think you\'re off the hook. They\'re wrong.',
                'Fresh code! Like fresh bait. Cast your line.',
                'New code! Your previous one was compromised by "ethics."',
                'Code changed! The old one was linked to too many suspicious Google searches.',
                '🔄 New referral code! Our algorithm identified better victim demographics.',
            ];
            return jokes[Math.floor(Math.random() * jokes.length)];
        }

        function getMilestoneReachedMsg(count) {
            var idx = Math.min(count - 1, referralData.milestoneMessages.length - 1);
            return referralData.milestoneMessages[idx];
        }

        function updateStats() {
            if (!statsEl) return;

            var ms = getMilestoneForCount(savedCount);
            var discount = ms ? ms.discount : 0;
            var fakeSavings = '$' + (savedCount * 34.9).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            var fakeTotalSavings = '$' + (savedCount * 34.9 * 1.08).toFixed(0);

            statsEl.innerHTML =
                '<div class="ref-stats-grid">' +
                    '<div class="ref-stat card--static">' +
                        '<div class="ref-stat-icon">👥</div>' +
                        '<div class="ref-stat-value" id="ref-stat-count">' + savedCount + '</div>' +
                        '<div class="ref-stat-label">VICTIMS RECRUITED</div>' +
                    '</div>' +
                    '<div class="ref-stat card--static">' +
                        '<div class="ref-stat-icon">💰</div>' +
                        '<div class="ref-stat-value">' + (discount > 0 ? discount + '%' : '0%') + '</div>' +
                        '<div class="ref-stat-label">CURRENT DISCOUNT</div>' +
                    '</div>' +
                    '<div class="ref-stat card--static">' +
                        '<div class="ref-stat-icon">💸</div>' +
                        '<div class="ref-stat-value">' + fakeSavings + '</div>' +
                        '<div class="ref-stat-label">TOTAL "SAVED"</div>' +
                    '</div>' +
                    '<div class="ref-stat card--static">' +
                        '<div class="ref-stat-icon">📋</div>' +
                        '<div class="ref-stat-value">' + fakeTotalSavings + '</div>' +
                        '<div class="ref-stat-label">CLAIMED VALUE (unverifiable)</div>' +
                    '</div>' +
                '</div>';

            if (milestonesEl) {
                var msHTML = '<div class="ref-milestones">';
                for (var m = 0; m < referralData.discountMilestones.length; m++) {
                    var mstone = referralData.discountMilestones[m];
                    var unlocked = savedCount >= mstone.count;
                    msHTML += '<div class="ref-milestone ' + (unlocked ? 'ref-milestone-unlocked' : 'ref-milestone-locked') + '">' +
                        '<span class="ref-milestone-icon">' + (unlocked ? '✅' : '🔒') + '</span>' +
                        '<span class="ref-milestone-label">' + mstone.label + '</span>' +
                        '</div>';
                }
                msHTML += '</div>';
                milestonesEl.innerHTML = msHTML;
            }
        }

        function renderVictims() {
            if (!victimListEl || savedVictims.length === 0) {
                if (victimListEl) victimListEl.innerHTML = '<div class="ref-no-victims">No victims yet. Your circle of trust remains intact. For now.</div>';
                return;
            }
            var html = '';
            for (var i = 0; i < savedVictims.length; i++) {
                var vName = savedVictims[i].replace(' (repeat victim — they didn\'t learn)', '');
                var vData = victimNames[vName];
                var stars = '';
                var rating = vData ? vData.rating : Math.floor(Math.random() * 5) + 1;
                for (var s = 0; s < 5; s++) {
                    stars += s < rating ? '⭐' : '☆';
                }
                html += '<div class="ref-victim-card card--static">' +
                    '<div class="ref-victim-name">🎯 ' + savedVictims[i] + '</div>' +
                    (vData ? '<div class="ref-victim-injury">🩹 ' + vData.injury + '</div>' : '') +
                    (vData ? '<div class="ref-victim-quote">"' + vData.quote + '"</div>' : '') +
                    '<div class="ref-victim-rating">Victim Satisfaction: ' + stars + '</div>' +
                    '</div>';
            }
            victimListEl.innerHTML = html;
        }

        function playClipSound() {
            try {
                var ctx = new (window.AudioContext || window.webkitAudioContext)();
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 800 + Math.random() * 400;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.15);
            } catch(e) {}
        }

        function playCopySound() {
            try {
                var ctx = new (window.AudioContext || window.webkitAudioContext)();
                var osc = ctx.createOscillator();
                var gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 600;
                osc.type = 'triangle';
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.2);
                setTimeout(function() {
                    var osc2 = ctx.createOscillator();
                    var gain2 = ctx.createGain();
                    osc2.connect(gain2);
                    gain2.connect(ctx.destination);
                    osc2.frequency.value = 900;
                    osc2.type = 'triangle';
                    gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.35);
                    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
                    osc2.start(ctx.currentTime + 0.35);
                    osc2.stop(ctx.currentTime + 0.55);
                }, 200);
            } catch(e) {}
        }

        codeEl.textContent = getOrCreateCode();
        updateStats();
        renderVictims();

        if (copyMsg) {
            if (savedCount > 0) {
                copyMsg.textContent = '✓ You\'ve referred ' + savedCount + ' buddy' + (savedCount !== 1 ? 'ies' : 'y') + ' so far! ' + (savedCount >= 10 ? 'You\'re a menace.' : savedCount >= 5 ? 'Your friends are catching on.' : savedCount >= 3 ? 'You\'re building a list.' : 'Keep going!');
            } else {
                copyMsg.textContent = 'No victims yet. Your conscience is still clean. For now.';
            }
        }

        if (genBtn) {
            genBtn.addEventListener('click', function() {
                savedCode = generateCode();
                localStorage.setItem('podi_referral_code', savedCode);
                codeEl.textContent = savedCode;
                if (copyMsg) copyMsg.textContent = getNewCodeJoke();
                playClipSound();
            });
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', function() {
                var textarea = document.createElement('textarea');
                textarea.value = savedCode;
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    playCopySound();
                    copyBtn.textContent = '✓ COPIED!';
                    copyBtn.classList.add('copied');
                    if (copyMsg) {
                        savedCount++;
                        localStorage.setItem('podi_referral_count', savedCount.toString());
                        var victim = addFakeVictim();
                        var joke = getCopyJokes();
                        var milestoneMsg = '';
                        for (var m = 0; m < referralData.discountMilestones.length; m++) {
                            if (savedCount === referralData.discountMilestones[m].count) {
                                milestoneMsg = ' 🎉 MILESTONE: ' + referralData.discountMilestones[m].label + '! ' + getMilestoneReachedMsg(savedCount);
                                playCopySound();
                                setTimeout(playCopySound, 300);
                            }
                        }
                        copyMsg.textContent = joke + milestoneMsg;
                        updateStats();
                        renderVictims();
                    }
                    setTimeout(function() {
                        copyBtn.textContent = '📋 COPY CODE';
                        copyBtn.classList.remove('copied');
                    }, 3000);
                } catch(e) {
                    if (copyMsg) copyMsg.textContent = '✗ Could not copy. Try selecting the code manually. Or use your words.';
                }
                document.body.removeChild(textarea);
            });
        }

        if (shareLinkBtn) {
            shareLinkBtn.addEventListener('click', function() {
                var url = window.location.origin + '/courses.html?ref=' + savedCode;
                var textarea = document.createElement('textarea');
                textarea.value = 'Hey! I\'m referring you to the PODI Rescue Diver course. Use my code: ' + savedCode + ' — ' + url + ' (You\'ll love it. Probably. No promises.)';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    playCopySound();
                    shareLinkBtn.textContent = '✓ LINK COPIED!';
                    if (copyMsg) copyMsg.textContent = '✓ Referral link copied! Send it to someone you tolerate. We\'ll take it from here. (Violently.)';
                    setTimeout(function() {
                        shareLinkBtn.textContent = '🔗 COPY SHARE LINK';
                    }, 2500);
                } catch(e) {
                    if (copyMsg) copyMsg.textContent = '✗ Could not copy link. The ocean is unforgiving and so is our clipboard API.';
                }
                document.body.removeChild(textarea);
            });
        }

        if (shareEmailBtn) {
            var emailUrl = window.location.origin + '/courses.html?ref=' + getOrCreateCode();
            var subject = encodeURIComponent('You\'ve been referred for... an experience');
            var excuses = [
                'I thought of you immediately when I saw this. You have that "victim" look. In a good way!',
                'You\'re the first person I thought of. That\'s either a compliment or a warning. I haven\'t decided.',
                'This course needs someone with your... specific skill set. Mainly the skill of being a good sport.',
                'I know you\'ve been looking for a challenge. This one challenges your will to live. In a fun way!',
                'Remember that time you said "I\'d try anything once"? This is anything. And it\'s once. Perfect fit.',
                'You owe me from that thing. You know the thing. This makes us even. (You don\'t owe me. But now you will.)',
            ];
            var excuse = excuses[Math.floor(Math.random() * excuses.length)];
            var body = encodeURIComponent(
                'Hey!\n\n'
                + excuse + '\n\n'
                + 'I\'m referring you to the PODI Rescue Diver course. The instructor "fights back," which I think you\'ll find refreshing.\n\n'
                + 'Use my referral code: ' + getOrCreateCode() + '\n'
                + 'Sign up here: ' + emailUrl + '\n\n'
                + 'Trust me, it\'ll be an experience. What\'s the worst that happens? You learn valuable rescue skills?\n\n'
                + '- Your "friend"\n\n'
                + 'P.S. Don\'t read the waiver. It ruins the vibe.'
            );
            shareEmailBtn.href = 'mailto:?subject=' + subject + '&body=' + body;
        }
    }

    // ============================================================
    // 20. HOMEPAGE REFERRAL MODAL
    // ============================================================
    function initHomepageReferral() {
        var ctaBtn = document.getElementById('home-referral-cta');
        if (!ctaBtn) return;

        ctaBtn.addEventListener('click', function(e) {
            e.preventDefault();

            var existing = document.getElementById('home-ref-modal');
            if (existing) existing.remove();

            var storedCode = localStorage.getItem('podi_referral_code');
            if (!storedCode) {
                var prefix = 'PODI-REF-';
                var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                storedCode = prefix;
                for (var i = 0; i < 6; i++) {
                    storedCode += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                localStorage.setItem('podi_referral_code', storedCode);
            }
            var storedCount = parseInt(localStorage.getItem('podi_referral_count') || '0');

            var overlay = document.createElement('div');
            overlay.id = 'home-ref-modal';
            overlay.className = 'ref-home-overlay';

            var fakeVictim = referralData.victims[Math.floor(Math.random() * referralData.victims.length)];

            overlay.innerHTML =
                '<div class="ref-home-modal card--static">' +
                    '<div class="ref-home-close" id="home-ref-close">✕</div>' +
                    '<div class="ref-home-badge">🎯 YOUR REFERRAL KIT</div>' +
                    '<h3 class="ref-home-title">Refer a Buddy &mdash; <span>They\'re the VICTIM</span></h3>' +
                    '<p class="ref-home-desc">Share this code with a "friend." They get rescued. <strong>You get 10% off.</strong> Everyone wins! (Results not guaranteed for the "friend.")</p>' +
                    '<div class="ref-home-code">' +
                        '<span class="ref-home-code-label">Your Code:</span>' +
                        '<span class="ref-home-code-value" id="home-ref-code">' + storedCode + '</span>' +
                        '<button class="ref-home-copy-btn" id="home-ref-copy">📋 COPY</button>' +
                    '</div>' +
                    '<div class="ref-home-copy-msg" id="home-ref-copy-msg"></div>' +
                    '<div class="ref-home-stats-mini">' +
                        '<span>👥 Referred: <strong>' + storedCount + '</strong></span>' +
                        '<span>💰 Discount: <strong>' + (storedCount >= 1 ? '10%' : '0% (refer 1 to unlock)') + '</strong></span>' +
                    '</div>' +
                    '<div class="ref-home-victim-spotlight">' +
                        '<span class="ref-home-spotlight-label">🎭 Sample Victim:</span>' +
                        '<span class="ref-home-spotlight-name">' + fakeVictim.name + '</span>' +
                        '<span class="ref-home-spotlight-injury">🩹 ' + fakeVictim.injury + '</span>' +
                        '<span class="ref-home-spotlight-rating">' + '⭐'.repeat(fakeVictim.rating) + '☆'.repeat(5 - fakeVictim.rating) + '</span>' +
                    '</div>' +
                    '<a href="courses.html#referral-program" class="cta-button ref-home-cta">Full Referral Dashboard →</a>' +
                    '<p class="ref-home-footer-note">* "Victim" is a training term. We checked. It\'s fine. Probably.</p>' +
                '</div>';

            document.body.appendChild(overlay);

            overlay.addEventListener('click', function(e) {
                if (e.target === overlay || e.target.id === 'home-ref-close') {
                    overlay.style.opacity = '0';
                    overlay.style.transition = 'opacity 0.3s';
                    setTimeout(function() {
                        if (overlay.parentNode) overlay.remove();
                    }, 300);
                }
            });

            var copyBtn = document.getElementById('home-ref-copy');
            var copyMsg = document.getElementById('home-ref-copy-msg');
            if (copyBtn) {
                copyBtn.addEventListener('click', function() {
                    var textarea = document.createElement('textarea');
                    textarea.value = storedCode;
                    document.body.appendChild(textarea);
                    textarea.select();
                    try {
                        document.execCommand('copy');
                        try {
                            var ctx = new (window.AudioContext || window.webkitAudioContext)();
                            var osc = ctx.createOscillator();
                            var gain = ctx.createGain();
                            osc.connect(gain);
                            gain.connect(ctx.destination);
                            osc.frequency.value = 660;
                            osc.type = 'sine';
                            gain.gain.setValueAtTime(0.1, ctx.currentTime);
                            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                            osc.start(ctx.currentTime);
                            osc.stop(ctx.currentTime + 0.2);
                        } catch(e) {}
                        copyBtn.textContent = '✓ COPIED!';
                        copyBtn.style.background = 'linear-gradient(135deg, #00a86b, #008050)';
                        if (copyMsg) copyMsg.textContent = 'Copied! Your buddy\'s journey begins now. They just don\'t know it yet.';
                        var countEl = overlay.querySelector('.ref-home-stats-mini strong:first-child');
                        if (countEl) {
                            var newCount = storedCount + 1;
                            localStorage.setItem('podi_referral_count', newCount.toString());
                            countEl.textContent = newCount;
                        }
                        setTimeout(function() {
                            copyBtn.textContent = '📋 COPY';
                            copyBtn.style.background = '';
                        }, 2500);
                    } catch(e) {
                        if (copyMsg) copyMsg.textContent = 'Couldn\'t copy. The ocean currents interfere with our clipboard. Try again.';
                    }
                    document.body.removeChild(textarea);
                });
            }
        });
    }

    // ============================================================
    // INIT
    // ============================================================
    function init() {
        console.log('%c🤿 PODI Scripts Loaded', 'color: #ff6600; font-size: 16px; font-weight: bold');

        // Phase 1: Lightweight — event listeners only (runs before paint)
        initCertGenerator();
        initRiskTool();
        initCertVerification();
        initLostCard();
        initInsuranceModals();
        initComplaints();
        initBuddyTinder();
        initReferralProgram();
        initHomepageReferral();

        // Event delegation for shop
        var shopGrid = document.querySelector('.shop-grid');
        if (shopGrid) {
            shopGrid.addEventListener('click', function(e) {
                var btn = e.target.closest('.shop-add-btn');
                if (btn) addToCart(btn);
            });
        }

        // Event delegation for gallery
        var galleryGrid = document.getElementById('gallery-grid');
        if (galleryGrid) {
            galleryGrid.addEventListener('click', function(e) {
                var item = e.target.closest('.gallery-item');
                if (item) openGallery(item);
            });
        }

        var galleryModal = document.getElementById('gallery-modal');
        if (galleryModal) {
            galleryModal.addEventListener('click', function(e) {
                if (e.target === galleryModal) closeGalleryModal();
            });
        }
        document.addEventListener('click', function(e) {
            if (e.target.closest('.gallery-modal-close')) closeGalleryModal();
        });

        var galleryFilters = document.querySelector('.gallery-filters');
        if (galleryFilters) {
            galleryFilters.addEventListener('click', function(e) {
                var btn = e.target.closest('.gallery-filter');
                if (btn) {
                    var filter = btn.getAttribute('data-filter');
                    if (filter) filterGallery(filter, btn);
                }
            });
        }

        // Event delegation for blog
        var blogList = document.getElementById('blog-list');
        if (blogList) {
            blogList.addEventListener('click', function(e) {
                var header = e.target.closest('.blog-post-header');
                if (header) toggleBlog(header);
            });
        }

        // Event delegation for newsletter
        var newsletterForm = document.getElementById('newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', function(e) {
                e.preventDefault();
                newsletterSignup();
            });
        }

        // Event delegation for e-learning
        var elearningBtn = document.getElementById('elearning-play-btn');
        if (elearningBtn) {
            elearningBtn.addEventListener('click', startELearning);
        }

        // Phase 2: Heavy work — defer DOM creation to after first paint
        requestAnimationFrame(function() {
            var currentPage = window.location.pathname.split('/').pop() || 'index.html';
            var pagesWithComputer = ['index.html', 'courses.html', 'technical.html', 'charter.html', 'gallery.html', 'shop.html'];
            if (pagesWithComputer.indexOf(currentPage) !== -1 && !document.getElementById('podi-computer')) {
                diveComputer.init();
            }

            initDiveTips();
            initCookieBanner();
            initPermanentRecord();
            initConditionsReport();
            badgeSystem.init();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
