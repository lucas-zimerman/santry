import {useState} from 'react';
import styled from '@emotion/styled';

import CheckboxFancy from 'sentry/components/checkboxFancy/checkboxFancy';
import space from 'sentry/styles/space';
import {Project} from 'sentry/types';
import localStorage from 'sentry/utils/localStorage';

type Props = {
  docContent: string | undefined;
  docKey: string;
  project: Project;
};

function OnBoardingStep(props: Props) {
  const {docKey, project, docContent} = props;

  const [increment, setIncrement] = useState<number>(0);

  if (!docContent) {
    return null;
  }

  const localStorageKey = `perf-onboarding-${project.id}-${docKey}`;

  function isChecked() {
    return localStorage.getItem(localStorageKey) === 'check';
  }

  return (
    <Wrapper>
      <TaskCheckBox>
        <CheckboxFancy
          size="22px"
          isChecked={isChecked()}
          onClick={event => {
            event.preventDefault();
            event.stopPropagation();

            if (isChecked()) {
              localStorage.removeItem(localStorageKey);
            } else {
              localStorage.setItem(localStorageKey, 'check');
            }
            setIncrement(increment + 1);

            return;
          }}
        />
      </TaskCheckBox>
      <DocumentationWrapper dangerouslySetInnerHTML={{__html: docContent}} />
    </Wrapper>
  );
}

const Wrapper = styled('div')`
  position: relative;
`;

const TaskCheckBox = styled('div')`
  float: left;
  margin-right: ${space(1.5)};
  height: 27px;
  display: flex;
  align-items: center;
  z-index: 2;
  position: relative;
`;

const DocumentationWrapper = styled('div')`
  p {
    line-height: 1.5;
  }
  pre {
    word-break: break-all;
    white-space: pre-wrap;
  }
  z-index: 1;
  position: relative;
`;

export default OnBoardingStep;
