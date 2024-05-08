import { FC, useState, ChangeEvent } from 'react';

interface IChangeNicknameProps {
  handleSubmitChange: (name: string) => void;
  isDisappearing: boolean;
}

const ChangeName: FC<IChangeNicknameProps> = ({ isDisappearing, handleSubmitChange }) => {
  const [name, setName] = useState<string>('');
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setName(e.target.value);
  };

  return (
    <div className={`change-name appearing ${isDisappearing ? 'disappearing' : ''}`}>
      <h4 className='change-name__title'>Введіть нове ім&apos;я</h4>
      <input
        type='text'
        className='change-name__input'
        placeholder="Нове ім'я"
        value={name}
        onChange={handleInputChange}
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
