import confetti from 'canvas-confetti'
import m from 'mithril'

window.log = m => v => {
  console.log(m, v)
  return v
}


const getScreenOrientation = (mdl) => {
  let winW = window.innerWidth
  // set display profiles
  const getProfile = (w) => {
    if (w < 668) return "PHONE"
    if (w < 920) return "TABLET"
    return "DESKTOP"
  }

  const checkWidth = (winW) => {
    const w = window.innerWidth
    if (winW !== w) {
      winW = w
      let lastProfile = mdl.state.screenSize()
      mdl.state.screenSize(getProfile(w))
      if (lastProfile != mdl.state.screenSize()) m.redraw()
    }
    return requestAnimationFrame(checkWidth)
  }

  mdl.state.screenSize(getProfile(winW))

  checkWidth(winW)

}

const setupResponsiveness = (mdl) => getScreenOrientation(mdl)


const getRandom = xs => xs[Math.floor(Math.random() * xs.length)]

const distanceBetweenElements = (el1, el2) => {
  const x1 = el1.offsetTop;
  const y1 = el1.offsetLeft;
  const x2 = el2.offsetTop;
  const y2 = el2.offsetLeft;
  const xDistance = x1 - x2;
  const yDistance = y1 - y2;
  return Math.sqrt((xDistance * xDistance) + (yDistance * yDistance));
}

const uuid = () =>
  'xxxxxxxx'.replace(/[xy]/g, (c) => {
    let r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const fireworks = () => {
  const duration = 15 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }
    const particleCount = 50 * (timeLeft / duration);
    // since particles fall down, start a bit higher than random
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
  }, 250);
}


export {
  getRandom, distanceBetweenElements, uuid, fireworks, setupResponsiveness
}
