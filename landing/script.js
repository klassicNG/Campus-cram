/**
 * Campus-Cram Landing Page Interactive Engine
 * Handles 3D Tilt, Interactive Mockup Simulation, Modals, and Micro-interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // 1. Mockup Stage Tab Switcher Data & State
  // --------------------------------------------------------------------------
  const mockupData = {
    theory: {
      badge: 'Theory Exam Hall',
      badgeClass: 'badge-amber',
      headline: 'Authentic Multi-Part Theory Exams with AI Professor Grading',
      summary: 'Practice university standard theory exams where every question strictly adheres to parts (a), (b), and (c) totaling 20 marks. Photograph your handwritten answer sheets and get immediate multi-criteria scoring.',
      checklist: [
        'Strict Nigerian university structure: (a), (b), (c) totaling 20 marks',
        'Handwritten OCR: reads student handwriting and step-by-step math derivations',
        'Marking guide rubric: assesses conceptual clarity, formulas, and diagrams',
        'Departmental standard answers and model solutions comparison'
      ],
      screenHtml: `
        <div style="display:flex; flex-direction:column; gap:12px; height:100%;">
          <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.06); padding:8px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:10px; font-weight:800; background:#ffa200; color:#001524; padding:2px 6px; border-radius:6px;">CSC 301</span>
              <span style="font-size:11px; font-weight:700; color:#ffffff;">Exam Hall • Q1 of 3</span>
            </div>
            <span style="font-size:11px; font-weight:800; color:#ffa200; font-family:monospace;">118:42</span>
          </div>

          <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-size:11px; font-weight:800; color:#ffa200;">QUESTION 1 (20 MARKS)</span>
              <span style="font-size:9px; background:rgba(255,162,0,0.15); color:#ffba38; padding:2px 6px; border-radius:4px; font-weight:700;">Deadlock Avoidance</span>
            </div>
            <div style="font-size:10.5px; color:#f1f5f9; line-height:1.4; margin-bottom:6px;">
              <b>(a)</b> State the four Coffman conditions necessary for deadlock. Differentiate between Prevention and Avoidance. <span style="color:#ffa200; font-weight:700;">[6 Marks]</span>
            </div>
            <div style="font-size:10.5px; color:#f1f5f9; line-height:1.4; margin-bottom:6px;">
              <b>(b)</b> Given 5 processes and 3 resources, prove if the state is safe using Banker's Algorithm and derive the safe sequence. <span style="color:#ffa200; font-weight:700;">[8 Marks]</span>
            </div>
            <div style="font-size:10.5px; color:#f1f5f9; line-height:1.4;">
              <b>(c)</b> Rigorously prove why total ordering prevents Circular Wait. <span style="color:#ffa200; font-weight:700;">[6 Marks]</span>
            </div>
          </div>

          <!-- AI Evaluation Grade Sheet Snippet -->
          <div style="background:linear-gradient(135deg, rgba(16,185,129,0.15), rgba(14,20,32,0.8)); border:1px solid rgba(16,185,129,0.3); border-radius:14px; padding:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="width:8px; height:8px; border-radius:50%; background:#10b981;"></span>
                <span style="font-size:11px; font-weight:800; color:#10b981;">AI Examiner Grade Sheet</span>
              </div>
              <span style="font-size:12px; font-weight:900; color:#ffffff; background:#10b981; color:#001524; padding:2px 8px; border-radius:6px;">18 / 20 MARKS</span>
            </div>
            <div style="font-size:10px; color:#94a3b8; line-height:1.4;">
              <b>Key Strengths:</b> Identified Coffman conditions precisely. Clear vector arithmetic for Need and Available matrices with valid sequence &lt;P1, P3, P4, P0, P2&gt;.
            </div>
          </div>
        </div>
      `
    },

    cbt: {
      badge: 'CBT Simulator',
      badgeClass: 'badge-cyan',
      headline: 'High-Pressure 40 & 60-Question Computer Based Tests',
      summary: 'Condition your reflexes under real ticking exam clocks. Experience tricky negative distractors, university syllabus questions, and instant post-exam analytics.',
      checklist: [
        'Standard 40-test and 60-exam formats calibrated to Nigerian universities',
        'Dynamic countdown timer with automatic submission safeguard',
        'Option shuffling and procedural scenario questions',
        'Instant score calculation with deep conceptual explanations'
      ],
      screenHtml: `
        <div style="display:flex; flex-direction:column; gap:12px; height:100%;">
          <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.06); padding:8px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:10px; font-weight:800; background:#00d2ff; color:#001524; padding:2px 6px; border-radius:6px;">CBT EXAM</span>
              <span style="font-size:11px; font-weight:700; color:#ffffff;">Question 14 of 60</span>
            </div>
            <span style="font-size:11px; font-weight:800; color:#ff4444; font-family:monospace; background:rgba(255,68,68,0.15); padding:2px 6px; border-radius:4px;">⏱ 24:18</span>
          </div>

          <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:12px;">
            <span style="font-size:9.5px; font-weight:700; color:#00d2ff; text-transform:uppercase; letter-spacing:0.05em;">Memory Management & Paging</span>
            <div style="font-size:11px; color:#f8fafc; font-weight:600; line-height:1.4; margin-top:4px;">
              When a Translation Lookaside Buffer (TLB) misses, where does the Memory Management Unit (MMU) look next?
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:6px;">
            <div style="display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); font-size:10.5px; color:#94a3b8;">
              <b style="color:#ffffff;">A.</b> Secondary Swap Disk Partition
            </div>
            <div style="display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:10px; background:rgba(0,210,255,0.15); border:1px solid #00d2ff; font-size:10.5px; color:#ffffff; font-weight:600;">
              <b style="color:#00d2ff;">B.</b> The Page Table stored in Physical RAM (Selected)
            </div>
            <div style="display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); font-size:10.5px; color:#94a3b8;">
              <b style="color:#ffffff;">C.</b> CPU Level 1 Instruction Cache
            </div>
            <div style="display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:10px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); font-size:10.5px; color:#94a3b8;">
              <b style="color:#ffffff;">D.</b> Direct Memory Access (DMA) Controller
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; margin-top:auto; padding-top:4px;">
            <span style="font-size:10px; color:#64748b;">Answered: 14/60</span>
            <span style="font-size:10px; color:#00d2ff; font-weight:700;">Tap Next →</span>
          </div>
        </div>
      `
    },

    cram: {
      badge: 'Cram Sheets',
      badgeClass: 'badge-amber',
      headline: '70%+ High-Yield Flashcards & Spaced Repetition',
      summary: 'Distill 50-page lecture PDF slide handouts into punchy, high-yield memory anchors, exam traps, and unforgettable mnemonics before entering the hall.',
      checklist: [
        'AI auto-extraction from lecture slides, syllabus, and notes',
        'Exam Traps: alerts for common tricky questions lecturers use to catch students',
        'Mnemonic hooks: clever memory patterns for instant recall under stress',
        'Interactive card flipping with spaced repetition mastery rating'
      ],
      screenHtml: `
        <div style="display:flex; flex-direction:column; gap:12px; height:100%;">
          <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.06); padding:8px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:10px; font-weight:800; background:#ffa200; color:#001524; padding:2px 6px; border-radius:6px;">CRAM DECK</span>
              <span style="font-size:11px; font-weight:700; color:#ffffff;">Card 2 of 12</span>
            </div>
            <span style="font-size:10px; color:#10b981; font-weight:700;">High Mastery • 85%</span>
          </div>

          <!-- Flip Card Container -->
          <div style="background:linear-gradient(135deg, rgba(255,162,0,0.1), rgba(14,20,32,0.9)); border:1px solid rgba(255,162,0,0.3); border-radius:16px; padding:16px; flex:1; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <span style="font-size:9px; font-weight:800; background:rgba(255,162,0,0.2); color:#ffa200; padding:2px 8px; border-radius:4px; text-transform:uppercase;">Crucial Formula</span>
              <h4 style="font-size:13px; font-weight:800; color:#ffffff; margin-top:8px; margin-bottom:6px;">Newton-Raphson Convergence</h4>
              <p style="font-size:10.5px; color:#cbd5e1; line-height:1.4;"><b>Recall Prompt:</b> What is the recurrence formula and what happens if f'(x) = 0?</p>
              
              <div style="background:rgba(0,0,0,0.4); border-radius:8px; padding:8px; margin-top:8px; font-family:monospace; font-size:11px; color:#ffa200; text-align:center;">
                x_{n+1} = x_n - [ f(x_n) / f'(x_n) ]
              </div>
            </div>

            <div style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); border-radius:8px; padding:8px; margin-top:8px;">
              <div style="font-size:9.5px; font-weight:800; color:#ef4444; margin-bottom:2px;">⚠️ EXAM TRAP:</div>
              <div style="font-size:9.5px; color:#fca5a5; line-height:1.3;">If f'(root) = 0 (multiple root), convergence drops from quadratic down to slow linear!</div>
            </div>
          </div>

          <div style="display:flex; gap:8px;">
            <button style="flex:1; background:rgba(239,68,68,0.2); border:1px solid rgba(239,68,68,0.4); color:#ef4444; border-radius:8px; padding:6px; font-size:10px; font-weight:700;">Hard</button>
            <button style="flex:1; background:rgba(255,162,0,0.2); border:1px solid rgba(255,162,0,0.4); color:#ffa200; border-radius:8px; padding:6px; font-size:10px; font-weight:700;">Good</button>
            <button style="flex:1; background:rgba(16,185,129,0.2); border:1px solid rgba(16,185,129,0.4); color:#10b981; border-radius:8px; padding:6px; font-size:10px; font-weight:700;">Mastered</button>
          </div>
        </div>
      `
    },

    tutor: {
      badge: 'Socratic AI Tutor',
      badgeClass: 'badge-emerald',
      headline: 'Interactive Socratic Guidance Tailored to Your Course',
      summary: 'Never get stuck staring at a blank page. The Socratic Tutor guides you through complex proofs, architectural trade-offs, and algorithms with targeted diagnostic questions.',
      checklist: [
        'Guides step-by-step rather than spoiling direct answers',
        'Deep understanding of course concepts and Nigerian syllabi',
        'Instant hints and boundary-check probes when you stumble',
        'Full conversation history preserved across your study sessions'
      ],
      screenHtml: `
        <div style="display:flex; flex-direction:column; gap:10px; height:100%;">
          <div style="display:flex; align-items:center; gap:8px; background:rgba(255,255,255,0.06); padding:8px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.1);">
            <div style="width:8px; height:8px; border-radius:50%; background:#10b981;"></div>
            <span style="font-size:11px; font-weight:700; color:#ffffff;">Professor Socratic AI • Active</span>
          </div>

          <!-- Chat Stream -->
          <div style="display:flex; flex-direction:column; gap:8px; flex:1;">
            <div style="background:rgba(255,255,255,0.07); border-radius:12px 12px 12px 2px; padding:10px; max-width:85%; border:1px solid rgba(255,255,255,0.08);">
              <div style="font-size:10.5px; color:#f1f5f9; line-height:1.4;">
                To prove why imposing a global resource ordering prevents Circular Wait, suppose a cycle exists: P0 → P1 → P0. What strict mathematical inequality must hold for their resource indices?
              </div>
            </div>

            <div style="background:rgba(255,162,0,0.18); border:1px solid rgba(255,162,0,0.3); border-radius:12px 12px 2px 12px; padding:10px; max-width:85%; margin-left:auto;">
              <div style="font-size:10.5px; color:#ffffff; line-height:1.4;">
                F(R_0) &lt; F(R_1) &lt; F(R_0), which implies F(R_0) &lt; F(R_0), an impossible contradiction!
              </div>
            </div>

            <div style="background:rgba(255,255,255,0.07); border-radius:12px 12px 12px 2px; padding:10px; max-width:85%; border:1px solid rgba(255,255,255,0.08);">
              <div style="font-size:10.5px; color:#10b981; font-weight:700; margin-bottom:2px;">Spot on! 🎯</div>
              <div style="font-size:10.5px; color:#f1f5f9; line-height:1.4;">
                Exact proof by contradiction! Now, how would you design this ordering function in a real distributed OS kernel?
              </div>
            </div>
          </div>

          <div style="display:flex; gap:6px; background:rgba(255,255,255,0.05); padding:6px; border-radius:10px; border:1px solid rgba(255,255,255,0.1);">
            <input type="text" placeholder="Type your response..." style="flex:1; background:transparent; border:none; color:#ffffff; font-size:11px; outline:none; padding-left:6px;" disabled value="By assigning unique monotonically increasing IDs...">
            <span style="background:#10b981; color:#001524; font-size:10px; font-weight:800; padding:4px 8px; border-radius:6px;">Send</span>
          </div>
        </div>
      `
    }
  };

  const stageTabs = document.querySelectorAll('.stage-tab-btn');
  const mockupBadge = document.getElementById('mockupBadge');
  const mockupHeadline = document.getElementById('mockupHeadline');
  const mockupSummary = document.getElementById('mockupSummary');
  const mockupChecklist = document.getElementById('mockupChecklist');
  const phoneScreen = document.getElementById('phoneScreen');

  function renderStage(tabKey) {
    const data = mockupData[tabKey];
    if (!data) return;

    // Update active tab buttons
    stageTabs.forEach(btn => {
      if (btn.dataset.tab === tabKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update text and badge
    if (mockupBadge) {
      mockupBadge.textContent = data.badge;
      mockupBadge.className = `mockup-badge ${data.badgeClass}`;
    }
    if (mockupHeadline) mockupHeadline.textContent = data.headline;
    if (mockupSummary) mockupSummary.textContent = data.summary;

    // Update checklist
    if (mockupChecklist) {
      mockupChecklist.innerHTML = data.checklist.map(item => `
        <li>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>${item}</span>
        </li>
      `).join('');
    }

    // Update phone screen content
    if (phoneScreen) {
      phoneScreen.style.opacity = '0';
      phoneScreen.style.transform = 'translateY(10px)';
      setTimeout(() => {
        phoneScreen.innerHTML = data.screenHtml;
        phoneScreen.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        phoneScreen.style.opacity = '1';
        phoneScreen.style.transform = 'translateY(0)';
      }, 150);
    }
  }

  stageTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      renderStage(tab.dataset.tab);
    });
  });

  // Render initial default tab
  renderStage('theory');

  // --------------------------------------------------------------------------
  // 2. 3D Tilt Effect on Glass Panels (Mouse Move Interaction)
  // --------------------------------------------------------------------------
  const tiltCards = document.querySelectorAll('.tilt-card');
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -6; // max 6 deg
      const rotateY = ((x - centerX) / centerX) * 6;  // max 6 deg

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    });
  });

  // --------------------------------------------------------------------------
  // 3. FAQ Accordion Interaction
  // --------------------------------------------------------------------------
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    questionBtn.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      // Close other items
      faqItems.forEach(other => {
        if (other !== item) other.classList.remove('active');
      });

      if (isActive) {
        item.classList.remove('active');
      } else {
        item.classList.add('active');
      }
    });
  });

  // --------------------------------------------------------------------------
  // 4. Modals (Installation Walkthrough & QR Code) & Smooth Nav
  // --------------------------------------------------------------------------
  const qrModal = document.getElementById('qrModal');
  const installModal = document.getElementById('installModal');

  const openQrBtns = document.querySelectorAll('.open-qr-trigger');
  const openInstallBtns = document.querySelectorAll('.open-install-trigger');
  const openInstallModalBtns = document.querySelectorAll('.open-install-modal-trigger');
  const modalCloseBtns = document.querySelectorAll('.modal-close-btn');

  // Smooth scroll to install guide and highlight it
  openInstallBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('install-guide');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        target.classList.remove('section-highlight');
        void target.offsetWidth; // trigger reflow
        target.classList.add('section-highlight');
      }
    });
  });

  // Open QR modal
  openQrBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (qrModal) qrModal.classList.add('active');
    });
  });

  // Open install walkthrough modal
  openInstallModalBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (installModal) installModal.classList.add('active');
    });
  });

  // Close modals
  modalCloseBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (qrModal) qrModal.classList.remove('active');
      if (installModal) installModal.classList.remove('active');
    });
  });

  // Close modal when clicking on overlay background
  [qrModal, installModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (qrModal) qrModal.classList.remove('active');
      if (installModal) installModal.classList.remove('active');
    }
  });

  // Copy Download Link to Clipboard
  const copyLinkBtns = document.querySelectorAll('.copy-link-btn');
  copyLinkBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const url = btn.dataset.url || 'https://github.com/klassicNG/Campus-cram/releases/latest';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          showToast('Direct download link copied to clipboard! 📋');
        }).catch(() => {
          showToast('Link: ' + url);
        });
      } else {
        showToast('Link: ' + url);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 5. Direct APK Download Trigger & Toast Notification
  // --------------------------------------------------------------------------
  const downloadBtns = document.querySelectorAll('.download-apk-btn');
  downloadBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Show notification toast
      showToast('Downloading Campus-Cram v1.0.0 APK (~45MB)...');
    });
  });

  function showToast(message) {
    let toast = document.getElementById('glassToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'glassToast';
      toast.style.position = 'fixed';
      toast.style.bottom = '24px';
      toast.style.right = '24px';
      toast.style.background = 'rgba(14, 20, 32, 0.95)';
      toast.style.backdropFilter = 'blur(16px)';
      toast.style.border = '1px solid rgba(255, 162, 0, 0.4)';
      toast.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
      toast.style.color = '#ffffff';
      toast.style.padding = '12px 20px';
      toast.style.borderRadius = '14px';
      toast.style.fontSize = '0.9rem';
      toast.style.fontWeight = '600';
      toast.style.zIndex = '999';
      toast.style.display = 'flex';
      toast.style.alignItems = 'center';
      toast.style.gap = '10px';
      toast.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffa200" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>${message}</span>
    `;

    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
    }, 4500);
  }

  // --------------------------------------------------------------------------
  // 6. Mobile Navigation Drawer Toggle & Smooth Anchor Handling
  // --------------------------------------------------------------------------
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobileDrawer = document.getElementById('mobileNavDrawer');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  if (mobileToggle && mobileDrawer) {
    function toggleMobileMenu(forceState) {
      const isOpen = forceState !== undefined ? forceState : !mobileDrawer.classList.contains('active');
      if (isOpen) {
        mobileDrawer.classList.add('active');
        mobileToggle.classList.add('active');
        mobileToggle.setAttribute('aria-expanded', 'true');
        mobileDrawer.setAttribute('aria-hidden', 'false');
      } else {
        mobileDrawer.classList.remove('active');
        mobileToggle.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileDrawer.setAttribute('aria-hidden', 'true');
      }
    }

    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMobileMenu();
    });

    mobileNavLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        toggleMobileMenu(false);
        const targetId = link.getAttribute('href');
        if (targetId && targetId.startsWith('#')) {
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            e.preventDefault();
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            if (targetId === '#install-guide') {
              targetEl.classList.remove('section-highlight');
              void targetEl.offsetWidth;
              targetEl.classList.add('section-highlight');
            }
          }
        }
      });
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (mobileDrawer.classList.contains('active') && !mobileDrawer.contains(e.target) && !mobileToggle.contains(e.target)) {
        toggleMobileMenu(false);
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileDrawer.classList.contains('active')) {
        toggleMobileMenu(false);
      }
    });
  }
});
