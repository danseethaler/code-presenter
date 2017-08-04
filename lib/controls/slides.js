'use babel';
import { React } from 'react-for-atom';
import { span } from 'glamorous';

const Container = span({
  border: '1px solid',
  borderRadius: 4,
  padding: '1px 5px',
  cursor: 'pointer'
});

export default ({ slides, currentPosition, play }) => {
  if (!slides.length) return <span>No Slides</span>;
  return (
    <Container onClick={play}>
      {`${currentPosition + 1}/${slides.length}`}
    </Container>
  );
};
