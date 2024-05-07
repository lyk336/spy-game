import { FC } from 'react';

interface INavbarProps {
  handleChangeNick: (name: string) => void;
}

const Navbar: FC<INavbarProps> = () => {
  return (
    <nav className='navbar'>
      <div className='navbar__container'>
        <button className='navbar__change-nickname'>Change nickname</button>
      </div>
    </nav>
  );
};

export default Navbar;
