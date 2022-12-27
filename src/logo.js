import m from 'mithril'
import bodymovin from 'lottie-web'

const makeLogo = ({ dom }) => {
  const svgContainer = dom;
  const animItem = bodymovin.loadAnimation({
    wrapper: svgContainer,
    animType: 'svg',
    loop: true,
    path: './assets/logo-lottie.json'
  });
}

const Logo = () => {
  return {
    oncreate: makeLogo,
    view: () => m('.#logo-container.lottie', {
      style: {
        width: 'var(--size)',
      }
    })
  }
}


export default Logo
