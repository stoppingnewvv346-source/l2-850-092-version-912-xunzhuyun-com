import { H as Hls } from './hls-vendor-dru42stk.js';
import { movies } from './movies.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function initMenu() {
  const toggle = $('[data-menu-toggle]');
  const nav = $('[data-site-nav]');

  if (!toggle || !nav) {
    return;
  }

  toggle.addEventListener('click', () => {
    nav.classList.toggle('is-open');
  });
}

function initHero() {
  const slider = $('[data-hero-slider]');
  if (!slider) {
    return;
  }

  const slides = $$('[data-hero-slide]', slider);
  const dots = $$('[data-hero-dot]', slider);
  const prev = $('[data-hero-prev]', slider);
  const next = $('[data-hero-next]', slider);
  let index = 0;
  let timer = null;

  const show = (nextIndex) => {
    index = (nextIndex + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === index);
    });

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === index);
    });
  };

  const start = () => {
    stop();
    timer = window.setInterval(() => show(index + 1), 5000);
  };

  const stop = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      show(Number(dot.dataset.heroDot));
      start();
    });
  });

  prev?.addEventListener('click', () => {
    show(index - 1);
    start();
  });

  next?.addEventListener('click', () => {
    show(index + 1);
    start();
  });

  slider.addEventListener('mouseenter', stop);
  slider.addEventListener('mouseleave', start);
  start();
}

function fillFilterOptions(panel, cards) {
  const years = new Set();
  const types = new Set();
  const regions = new Set();

  cards.forEach((card) => {
    if (card.dataset.year) years.add(card.dataset.year);
    if (card.dataset.type) types.add(card.dataset.type);
    if (card.dataset.region) regions.add(card.dataset.region);
  });

  const addOptions = (select, values) => {
    if (!select) {
      return;
    }

    [...values]
      .sort((a, b) => String(b).localeCompare(String(a), 'zh-CN'))
      .forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      });
  };

  addOptions($('[data-filter-year]', panel), years);
  addOptions($('[data-filter-type]', panel), types);
  addOptions($('[data-filter-region]', panel), regions);
}

function initFilters() {
  const panel = $('[data-filter-panel]');
  const cards = $$('.searchable-card');
  if (!panel || cards.length === 0) {
    return;
  }

  const search = $('[data-card-search]', panel);
  const year = $('[data-filter-year]', panel);
  const type = $('[data-filter-type]', panel);
  const region = $('[data-filter-region]', panel);
  const reset = $('[data-filter-reset]', panel);
  const count = $('[data-filter-count]');
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q') || '';

  fillFilterOptions(panel, cards);

  if (search && query) {
    search.value = query;
  }

  const apply = () => {
    const keyword = (search?.value || '').trim().toLowerCase();
    const selectedYear = year?.value || '';
    const selectedType = type?.value || '';
    const selectedRegion = region?.value || '';
    let visible = 0;

    cards.forEach((card) => {
      const haystack = [
        card.dataset.title,
        card.dataset.region,
        card.dataset.year,
        card.dataset.type,
        card.dataset.category,
        card.dataset.genre,
        card.dataset.tags
      ].join(' ').toLowerCase();

      const matchedKeyword = !keyword || haystack.includes(keyword);
      const matchedYear = !selectedYear || card.dataset.year === selectedYear;
      const matchedType = !selectedType || card.dataset.type === selectedType;
      const matchedRegion = !selectedRegion || card.dataset.region === selectedRegion;
      const matched = matchedKeyword && matchedYear && matchedType && matchedRegion;

      card.classList.toggle('is-hidden-by-filter', !matched);
      if (matched) visible += 1;
    });

    if (count) {
      count.textContent = `当前显示 ${visible} / ${cards.length} 部影片`;
    }
  };

  [search, year, type, region].forEach((control) => {
    control?.addEventListener('input', apply);
    control?.addEventListener('change', apply);
  });

  reset?.addEventListener('click', () => {
    if (search) search.value = '';
    if (year) year.value = '';
    if (type) type.value = '';
    if (region) region.value = '';
    apply();
  });

  apply();
}

function initPlayers() {
  const wrappers = $$('[data-video-wrap]');

  wrappers.forEach((wrap) => {
    const video = $('video[data-video-src]', wrap);
    const overlay = $('[data-play-overlay]', wrap);

    if (!video) {
      return;
    }

    const source = video.dataset.videoSrc;
    let hls = null;
    let attached = false;

    const attachSource = () => {
      if (attached || !source) {
        return;
      }

      attached = true;

      if (Hls && Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data?.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              hls.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
            } else {
              hls.destroy();
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else {
        video.src = source;
      }
    };

    const play = async () => {
      attachSource();
      try {
        await video.play();
      } catch (error) {
        console.warn('Video playback was blocked by the browser until a user gesture is received.', error);
      }
    };

    overlay?.addEventListener('click', play);
    video.addEventListener('click', () => {
      if (video.paused) {
        play();
      } else {
        video.pause();
      }
    });
    video.addEventListener('play', () => wrap.classList.add('is-playing'));
    video.addEventListener('pause', () => wrap.classList.remove('is-playing'));
    video.addEventListener('ended', () => wrap.classList.remove('is-playing'));
    video.addEventListener('loadedmetadata', () => wrap.classList.remove('is-loading'));

    window.addEventListener('beforeunload', () => {
      if (hls) {
        hls.destroy();
      }
    });
  });
}

function initHeaderSearchAssist() {
  const input = $('.header-search input[name="q"]');
  if (!input || !movies?.length) {
    return;
  }

  input.setAttribute('list', 'movie-title-list');
  const datalist = document.createElement('datalist');
  datalist.id = 'movie-title-list';

  movies.slice(0, 400).forEach((movie) => {
    const option = document.createElement('option');
    option.value = movie.title;
    datalist.appendChild(option);
  });

  document.body.appendChild(datalist);
}

document.addEventListener('DOMContentLoaded', () => {
  initMenu();
  initHero();
  initFilters();
  initPlayers();
  initHeaderSearchAssist();
});
