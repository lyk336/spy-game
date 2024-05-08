import { FC, useState, ChangeEvent, useRef, useEffect } from 'react';

interface IChangeNicknameProps {
  handleSubmitChange: (name: string) => void;
  isDisappearing: boolean;
}

const ChangeName: FC<IChangeNicknameProps> = ({ isDisappearing, handleSubmitChange }) => {
  const [name, setName] = useState<string>('');
  const submitOnEnter = useRef<() => void>();

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setName(e.target.value);
  };
  submitOnEnter.current = (): void => {
    handleSubmitChange(name);
  };

  useEffect(() => {
    const closeOnEsc = (e: KeyboardEvent): void => {
      if (e.key === 'Enter' && submitOnEnter.current) {
        submitOnEnter.current();
      }
    };
    document.addEventListener('keydown', closeOnEsc);

    return () => {
      document.removeEventListener('keydown', closeOnEsc);
    };
  }, []);

  return (
    <div className={`change-name appearing ${isDisappearing ? 'disappearing' : ''}`}>
      <h4 className='change-name__title'>Введіть нове ім&apos;я</h4>
      <input
        type='text'
        className='change-name__input'
        placeholder="Нове ім'я"
        value={name}
        onChange={handleInputChange}
        autoFocus
      />
      <button
        className='change-name__button blue-button'
        onClick={() => {
          handleSubmitChange(name);
        }}
      >
        Змінити
      </button>
    </div>
  );
};

export default ChangeName;
