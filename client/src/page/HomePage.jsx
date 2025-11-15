import React from 'react'
import Banner from '../components/Banner.jsx';
import Product from '../components/Product';
import Upcoming from '../components/Upcoming.jsx';
import ProductSlider from '../components/Post.jsx'


const HomePage = () => {
  return (
    <div>
      <Banner/>
      <Product/>
      <Upcoming/>
      < ProductSlider />

    </div>
  )
}

export default HomePage