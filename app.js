(() => {
  const stage = document.querySelector('.stage');
  const camera = document.getElementById('cameraCard');
  const cameraGif = document.getElementById('cameraGif');
  const buddyArea = document.getElementById('buddyArea');
  const typedEl = document.getElementById('typedText');
  const restEl = document.getElementById('restText');
  const progress = document.getElementById('speechProgress');
  const captureBtn = document.getElementById('captureBtn');
  const timer = document.getElementById('timer');
  const timerHint = document.getElementById('timerHint');
  const statusText = document.getElementById('statusText');
  const flash = document.getElementById('flash');
  const verify = document.getElementById('verify');
  let countdown = null, captured = false;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---- Buddy images: har text ke emotion ke hisaab se (buddy-1.png ... buddy-7.png) ----
  const buddyImg = buddyArea.querySelector('img.buddy');
  const BUDDY_IMGS = [1, 2, 3, 4, 5, 6, 7].map((n) => 'buddy-' + n + '.png');
  BUDDY_IMGS.forEach((src) => { const im = new Image(); im.src = src; });   // pehle se load
  let buddyNow = 0;
  function setBuddy(n, instant) {
    if (!buddyImg || n === buddyNow) return;
    buddyNow = n;
    const src = BUDDY_IMGS[n - 1];
    if (instant) {
      buddyImg.style.transition = 'none';
      buddyImg.src = src;
      buddyImg.style.opacity = '1';
      buddyImg.style.transform = 'none';
      return;
    }
    // Purani pose halki si fade-out, nayi pose buddy ke aane jaisi slow fade-in (1.8s)
    buddyImg.style.transition = 'opacity .25s ease';
    buddyImg.style.opacity = '0';
    setTimeout(() => {
      if (buddyNow !== n) return;
      buddyImg.style.transition = 'none';
      buddyImg.src = src;
      buddyImg.style.transform = 'translate(-10px,16px)';
      void buddyImg.offsetWidth;
      buddyImg.style.transition = 'opacity 1.8s ease, transform 1.8s ease';
      buddyImg.style.opacity = '1';
      buddyImg.style.transform = 'translate(0,0)';
    }, 270);
  }
  // Agar koi buddy image folder mein na mile toh purani buddy dikhe
  if (buddyImg) buddyImg.addEventListener('error', () => { buddyImg.src = 'security-buddy.png'; }, { once: true });

  // Capture (shutter) sound
  const captureSound = new Audio('capture-sound.mp3');
  captureSound.preload = 'auto';

  // Har nayi typeText purani typing ko rok deti hai
  let typeGen = 0;

  // Types text letter by letter (emoji-safe). The not-yet-typed part stays
  // invisible but still takes space, so the bubble never jumps in size.
  async function typeText(text, speed = 65) {
    const gen = ++typeGen;
    const chars = Array.from(text);
    typedEl.textContent = '';
    restEl.textContent = text;
    typedEl.classList.add('typing');
    for (let i = 1; i <= chars.length; i++) {
      if (gen !== typeGen) return;
      typedEl.textContent = chars.slice(0, i).join('');
      restEl.textContent = chars.slice(i).join('');
      await sleep(speed);
    }
    typedEl.classList.remove('typing');
  }

  function fillProgress(ms) {
    progress.style.transition = 'none';
    progress.style.width = '0';
    void progress.offsetWidth;
    progress.style.transition = 'width ' + ms + 'ms linear';
    progress.style.width = '100%';
  }

    async function intro() {
    // 1) Site opens -> 5 seconds of calm, nothing but the title.
    await sleep(5000);
    // 2) Buddy fades in slowly.
    setBuddy(1, true);
    buddyArea.classList.add('visible');
    await sleep(1900);
    buddyArea.classList.add('speaking');
    await sleep(350);

    // 3) Text 1
    await typeText('ahh wait.....tum kon ho 😒');
    fillProgress(5000);
    await sleep(5000);          // <-- text 1 ke baad kitna ruke (ms)

    // 4) Text 2
    progress.style.transition = 'none';
    progress.style.width = '0';
    typedEl.textContent = '';
    restEl.textContent = '';
    await sleep(250);
    setBuddy(2);
    await typeText('kya tum meri ceo ho 🤔');
    fillProgress(5000);
    await sleep(5000);          // <-- text 2 ke baad kitna ruke (ms)

    // 5) Text 3
    progress.style.transition = 'none';
    progress.style.width = '0';
    typedEl.textContent = '';
    restEl.textContent = '';
    await sleep(250);
    setBuddy(3);
    await typeText('time for your inspection for security reason🥱');

    // 6) Camera box appears
    fillProgress(5000);
    await sleep(5000);          // <-- text 3 ke baad camera kitni der mein aaye (ms)
    camera.classList.add('ready');

    // 7) Camera box aate hi buddy ka naya text (button dabne tak rehta hai)
    progress.style.transition = 'none';
    progress.style.width = '0';
    setBuddy(4);
    await typeText('hmmm... 😒 so press the purple button in the cam box plzz');
  }
  intro();

  captureBtn.addEventListener('click', () => {
    if (captured || countdown !== null || !camera.classList.contains('ready')) return;
    captured = true;
    captureBtn.disabled = true;
    // Purana text gayab, phir naya text
    typeGen++;
    typedEl.classList.remove('typing');
    typedEl.textContent = '';
    restEl.textContent = '';
    setTimeout(() => { setBuddy(5); typeText('shabaash 🥱 chalo abb cam ki taraf dekho'); }, 500);
    camera.classList.add('scanning');
    statusText.textContent = 'COUNTDOWN';
    timerHint.textContent = 'SMILE PLEASE ... 😁';
    document.getElementById('clickHint').classList.add('hide');
    let seconds = 10;
    timer.textContent = String(seconds).padStart(2, '0');
    countdown = setInterval(() => {
      seconds -= 1;
      timer.textContent = String(seconds).padStart(2, '0');
      if (seconds <= 0) {
        clearInterval(countdown);
        countdown = null;
        camera.classList.remove('scanning');
        statusText.textContent = 'CAPTURED';
        timer.textContent = 'CLICK!';
        flash.classList.remove('fire');
        void flash.offsetWidth;
        flash.classList.add('fire');
        captureSound.currentTime = 0;
        captureSound.play().catch(() => {});
        // Penguin GIF appears only now, shakes, then leaves. Only the GIF shakes.
        cameraGif.classList.add('gif-in');
        setTimeout(() => cameraGif.classList.add('gif-shake'), 350);
        setTimeout(() => {
          cameraGif.classList.remove('gif-shake');
          cameraGif.classList.remove('gif-in');
          cameraGif.classList.add('gif-out');
        }, 1400);
        // Then the (now empty) camera box leaves as before.
        setTimeout(() => {
          camera.classList.add('leaving');
          buddyArea.classList.remove('visible');
          setTimeout(() => {
            camera.style.display = 'none';
            stage.classList.add('done');
            verify.classList.add('visible');
            runVerify();
          }, 700);
        }, 2100);
      }
    }, 1000);
  });

  // ---- Verification sequence ----
  function el(id){return document.getElementById(id);}
  function setIcon(step, kind, mark){
    const ic = step.querySelector('.vicon');
    ic.className = 'vicon ' + kind;
    ic.textContent = mark || '';
  }
  async function fill(step, pct, ms){
    const f = step.querySelector('.vfill');
    f.style.transitionDuration = ms + 'ms';
    void f.offsetWidth;
    f.style.width = pct + '%';
    await sleep(ms);
  }
  // Whole-screen earthquake shake
  async function earthquake(ms){
    const target = document.querySelector('.app-shell');
    const n = Math.round(ms / 50), frames = [];
    for (let i = 0; i <= n; i++) {
      const p = i / n;
      const amp = (i === 0 || i === n) ? 0 : 20 * Math.min(1, p * 6, (1 - p) * 6);
      const r = () => Math.random() * 2 - 1;
      frames.push({transform: 'translate(' + (r()*amp) + 'px,' + (r()*amp*0.8) + 'px) rotate(' + (r()*amp*0.07) + 'deg)'});
    }
    target.animate(frames, {duration: ms, easing: 'linear'});
    await sleep(ms);
  }
  async function runVerify(){
    await sleep(1800);
    // Step 1: full green, verified
    const s1 = el('vs1'); s1.classList.add('show');
    await sleep(500);
    await fill(s1, 100, 4500);
    setIcon(s1, 'ok', '\u2713');
    const t1 = s1.querySelector('.vtext'); t1.textContent = 'Verified';
    s1.querySelector('.vnote').textContent = 'Aayee Haayeee......\uD83E\uDD70 ... Damn \uD83D\uDE0D itni sundar ladki  boring insaan  ki dost kese bangayi \uD83D\uDE12';
    await sleep(2800);
    // Step 2: bar completes fully, verified
    const s2 = el('vs2'); s2.classList.add('show');
    await sleep(500);
    await fill(s2, 100, 2600);
    setIcon(s2, 'ok', '\u2713');
    s2.querySelector('.vtext').textContent = 'Verified';
    s2.querySelector('.vnote').textContent = "cuteness overloaded.... gurl ,it is fuckn' illegal🥹 ";
    await sleep(2800);
    // Step 3: green line starts, turns red while filling, screen shakes 8s, then error text
    const s3 = el('vs3'); s3.classList.add('show');
    await sleep(7000);
    const f3 = s3.querySelector('.vfill');
    f3.style.transitionDuration = '2000ms';
    void f3.offsetWidth;
    f3.classList.add('red');   // colour fades green -> red while the line moves
    await fill(s3, 50, 2000);
    await earthquake(8000);
    setIcon(s3, 'bad', '\u2715');
    const t3 = s3.querySelector('.vtext'); t3.classList.add('red');
    t3.textContent = 'Even my code 💀 wasn’t prepared for that level of beauty 😭 whatta unreal beauty fr😍';
    await sleep(8000);
    // Wrap up
    el('vsteps').classList.add('out');
    el('verifyTitle').style.transition = 'opacity .5s'; el('verifyTitle').style.opacity = '0';
    await sleep(600);
    el('vsteps').style.display = 'none';
    el('verifyTitle').style.display = 'none';
    el('vdone').classList.add('show');
  }

  const modal = el('photoModal');
  el('viewBtn').addEventListener('click', () => { modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); });

  // Photo band karne ke baad: buddy fade-in -> 2 text -> neeche countdown 10..0 -> page1.html
  let afterPhotoStarted = false;
  async function afterPhoto(){
    // buddy ko pehle jaise bottom-left mein rakho, bubble abhi chhupa ke
    buddyArea.classList.remove('speaking');
    typedEl.textContent = '';
    restEl.textContent = '';
    progress.style.transition = 'none';
    progress.style.width = '0';
    setBuddy(6, true);
    buddyArea.classList.add('buddy-fixed');
    void buddyArea.offsetWidth;
    buddyArea.classList.add('visible');      // fade-in
    await sleep(2000);                        // <-- buddy aane ke baad kitna ruke (ms)
    buddyArea.classList.add('speaking');
    await sleep(350);

    // Text 1
    await typeText('maafi chhaunga,thoda samay barbaad karne ke liye security reasons ki vajah se....🥲');
    fillProgress(7000);
    await sleep(7000);                        // <-- text 1 kitni der dikhe (ms)

    // Text 2
    progress.style.transition = 'none';
    progress.style.width = '0';
    typedEl.textContent = '';
    restEl.textContent = '';
    await sleep(250);
    setBuddy(7);
    await typeText('only my ceo has access to it👉👈 ');
    fillProgress(2000);
    await sleep(2000);                        // <-- text 2 ke baad countdown kitni der mein aaye (ms)

    // Neeche beech mein countdown 10 -> 0
    const box = el('nextCountdown'), num = el('nextTimer');
    num.textContent = '10';
    box.classList.add('show');
    for (let n = 10; n >= 0; n--) {
      num.textContent = String(n);
      if (n > 0) await sleep(1000);
    }
    await sleep(700);

    // Smooth fade-out, phir agla page
    document.body.style.transition = 'opacity 1s ease';
    document.body.style.opacity = 0;
    setTimeout(() => { window.location.replace('page1.html'); }, 1000);
  }

  const closeModal = () => {
    if (!modal.classList.contains('open')) return;
    modal.classList.remove('open'); modal.setAttribute('aria-hidden','true');
    if (!afterPhotoStarted) { afterPhotoStarted = true; afterPhoto(); }
  };
  el('modalClose').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
})();
