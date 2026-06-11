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
            if (this.initialized) return;
            this.initialized = true;

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
            this.initialized = false;
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

    function initDiveTips() {
        var tipContainer = document.getElementById('podi-tips');
        if (!tipContainer) return;

        var currentIndex = Math.floor(Math.random() * diveTips.length);

        function showNextTip() {
            currentIndex = (currentIndex + 1) % diveTips.length;
            tipContainer.textContent = '💡 Pro Tip from Kyle: "' + diveTips[currentIndex] + '"';
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
                items[i].style.display = 'block';
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
    // INIT
    // ============================================================
    function init() {
        console.log('%c🤿 PODI Scripts Loaded', 'color: #ff6600; font-size: 16px; font-weight: bold');
        console.log('%c⚠ This website is a parody. Any functioning code is purely accidental.', 'color: #ff4444;');

        // Only init dive computer on pages with significant scrolling
        var currentPage = window.location.pathname.split('/').pop() || 'index.html';
        var pagesWithComputer = ['index.html', 'courses.html', 'technical.html', 'charter.html', 'gallery.html', 'shop.html'];
        if (pagesWithComputer.indexOf(currentPage) !== -1 && !document.getElementById('podi-computer')) {
            diveComputer.init();
        }

        initDiveTips();
        initCertGenerator();
        initRiskTool();
        initCookieBanner();
        initCertVerification();
        initPermanentRecord();
        initLostCard();
        initInsuranceModals();
        initConditionsReport();
        initComplaints();

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
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
