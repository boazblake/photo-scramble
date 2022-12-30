import m from 'mithril'
import bodymovin from 'lottie-web'
import logo from './photo-scramble-logo.png'
import loader from './loader.gif'
// import { logoLotti } from './files/logo/logo-lottie'

const makeLogo = ({ dom }) => {
  bodymovin.loadAnimation({
    wrapper: dom,
    animType: 'svg',
    loop: false,
    animationData: logoLotti,
    // path: 'https://lottie.host/d67ca5d8-423c-4cac-96ae-a9b25b89a49c/wE4jiOh8XE.json'
  });
}

const LogoStill = () => {
  return {
    view: ({ attrs: { isLogo } }) => isLogo ? m(`img#logo-still`, { src: logo, }) : m(`img`, { src: loader, })
    // oncreate: makeLogo,
    // view: () => m('.#logo-container.lottie', {
    //   'data-bm-renderer': 'svg',
    //   style: {
    //     position: 'relative',
    //     top: '-25%',
    //     left: 0,
    //     width: 'var(--size)',
    //   }
    // })
  }
}


export default LogoStill
