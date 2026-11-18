/* Shared state (main.js isse read karta hai) */
export const mouse = { x: 0, y: 0 };
export const scroll = { progress: 0 };

export function initUI() {
  /* Mouse */
  addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / innerWidth) * 2 - 1;
    mouse.y = (e.clientY / innerHeight) * 2 - 1;
  });

  /* Scroll progress bar */
  const bar = document.getElementById('progress');
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    scroll.progress = max > 0 ? scrollY / max : 0;
    bar.style.width = scroll.progress * 100 + '%';
  };
  addEventListener('scroll', onScroll);
  onScroll();

  /* Project card tilt */
  document.querySelectorAll('.tilt').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform =
        `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateY(-3px)`;
    });
    card.addEventListener('mouseleave', () => (card.style.transform = ''));
  });
}