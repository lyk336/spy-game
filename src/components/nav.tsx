import { FC, useEffect, useRef, useState } from 'react';
import ChangeName from './changeNameForm';
import { useTimeout } from '@/hooks/useTimeout';

interface INavbarProps {
  handleChangeName: (name: string) => void;
}

const Navbar: FC<INavbarProps> = ({ handleChangeName }) => {
  const [isChanging, setIsChanging] = useState<boolean>(false);
  const [isDisappearing, setIsDisappearing] = useState<boolean>(false);
  const { timeoutClear, timeout } = useTimeout();
  const closeOnEscRef = useRef<() => void>();

  const turnOffPopup = () => {
    setIsDisappearing(true);
    timeout(() => {
      setIsChanging(false);
      setIsDisappearing(false);
    }, 300);
  };
  const handleStartChanging = () => {
    // turning off
    if (isChanging && !isDisappearing) {
      turnOffPopup();
      return;
    }

    // turning on
    timeoutClear();
    setIsChanging(true);
    setIsDisappearing(false);
  };
  const handleSubmitChange = (name: string): void => {
    if (!name) return;

    turnOffPopup();
    handleChangeName(name);
  };
  closeOnEscRef.current = (): void => {
    if (isChanging) {
      turnOffPopup();
    }
  };

  useEffect(() => {
    const closeOnEsc = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && closeOnEscRef.current) {
        closeOnEscRef.current();
      }
    };
    document.addEventListener('keydown', closeOnEsc);

    return () => {
      document.removeEventListener('keydown', closeOnEsc);
    };
  }, []);

  return (
    <>
      <nav className='navbar'>
        <div className='navbar__container'>
          <button className='navbar__change-nickname blue-button' onClick={handleStartChanging}>
            Змінити ім&apos;я
          </button>
        </div>
      </nav>
      {isChanging && <ChangeName handleSubmitChange={handleSubmitChange} isDisappearing={isDisappearing} />}
    </>
  );
};

export default Navbar;
