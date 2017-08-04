'use babel';
import { React } from 'react-for-atom';
import { span } from 'glamorous';
import * as glamor from 'glamor';

const RecordSquare = span(
  {
    display: 'inline-block',
    marginLeft: 10,
    position: 'relative',
    top: 3,
    height: 15,
    width: 15,
    borderRadius: 3,
    backgroundColor: '#d8d8d8',
    cursor: 'pointer'
  },
  ({ isRecording }) => {
    if (!isRecording) return;
    const pulse = glamor.css.keyframes({
      '0%': { opacity: 0.7 },
      '50%': { opacity: 1 },
      '100%': { opacity: 0.7 }
    });
    return { animation: `${pulse} 1.5s infinite` };
  }
);

export default ({ isRecording, record, pause }) => {
  return isRecording
    ? <RecordSquare
      isRecording
      style={{ backgroundColor: '#bf1111' }}
      onClick={pause}
    />
    : <RecordSquare onClick={record} />;
};
