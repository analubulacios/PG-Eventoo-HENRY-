import { Link } from "react-router-dom";
import Menu from "./menu/Menu";
import Styles from "./NavBar.module.css";
import { useEffect, useState } from "react";
import SearchBar from "../SearchBar/SearchBar";
import LocationFilter from "./LocationFilter/LocationFilter";


const Navbar = () => {
  const [scrollHeight, setScrollHeight] = useState(0)
  
  const handleScroll = () => {
    const position = window.pageYOffset;
    setScrollHeight(position)
  }
  
  
  useEffect(()=> {
    window.addEventListener('scroll', handleScroll);
  }, [scrollHeight])



  return (
    <header className={Styles.ContenedorHeader}>
      <nav className={`${Styles.ContenedorNavbar} ${Styles.navbar} ${scrollHeight > 1 ? Styles.scrolling : null}`}>
        <div className={Styles.left}>
          <Link to="/">
            {" "}
            <span className={Styles.Titulo}>
              Even<span className={Styles.bold}>too</span>
            </span>
          </Link>
          <LocationFilter />
          </div>
        <div className={Styles.searchbarOpen}>
          <SearchBar />
        </div>
        <div className={Styles.MenuItems}>
            <Link className={Styles.MenuLink} to={"/create-event"}>Create Event</Link>
            <Menu />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;