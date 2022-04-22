import {Fragment, useEffect, useState} from 'react';
import styled from '@emotion/styled';

import HighlightTopRightPattern from 'sentry-images/pattern/highlight-top-right.svg';

import Button from 'sentry/components/button';
import DropdownMenuControlV2 from 'sentry/components/dropdownMenuControlV2';
import {MenuItemProps} from 'sentry/components/dropdownMenuItemV2';
import IdBadge from 'sentry/components/idBadge';
import LoadingIndicator from 'sentry/components/loadingIndicator';
import SidebarPanel from 'sentry/components/sidebar/sidebarPanel';
import {CommonSidebarProps, SidebarPanelKey} from 'sentry/components/sidebar/types';
import {
  withoutPerformanceSupport,
  withPerformanceOnboarding,
} from 'sentry/data/platformCategories';
import platforms from 'sentry/data/platforms';
import {t, tct} from 'sentry/locale';
import PageFiltersStore from 'sentry/stores/pageFiltersStore';
import {useLegacyStore} from 'sentry/stores/useLegacyStore';
import pulsingIndicatorStyles from 'sentry/styles/pulsingIndicator';
import space from 'sentry/styles/space';
import {Project} from 'sentry/types';
import EventWaiter from 'sentry/utils/eventWaiter';
import useApi from 'sentry/utils/useApi';
import useOrganization from 'sentry/utils/useOrganization';
import usePrevious from 'sentry/utils/usePrevious';
import useProjects from 'sentry/utils/useProjects';

import OnBoardingStep from './step';
import usePerformanceOnboardingDocs, {
  generateOnboardingDocKeys,
} from './usePerformanceOnboardingDocs';

function PerformanceOnboardingSidebar(props: CommonSidebarProps) {
  const {currentPanel, collapsed, hidePanel, orientation} = props;
  const isActive = currentPanel === SidebarPanelKey.PerformanceOnboarding;
  const organization = useOrganization();
  const access = new Set(organization.access);
  const hasProjectAccess = access.has('project:read');

  const {projects, initiallyLoaded: projectsLoaded} = useProjects();

  const [currentProject, setCurrentProject] = useState<Project | undefined>(undefined);

  const {selection, isReady} = useLegacyStore(PageFiltersStore);

  useEffect(() => {
    if (projects.length === 0 || !isReady || !isActive || currentProject !== undefined) {
      return;
    }

    const projectMap: Record<string, Project> = projects.reduce((acc, project) => {
      acc[project.id] = project;
      return acc;
    }, {});

    if (selection.projects.length) {
      // Among the project selection, find a project that has performance onboarding docs support, and has not sent
      // a first transaction event.
      const maybeProjectId = selection.projects.find(projectId => {
        const project = projectMap[String(projectId)];
        return (
          !project.firstTransactionEvent &&
          project.platform &&
          withPerformanceOnboarding.has(project.platform)
        );
      });

      if (typeof maybeProjectId === 'number') {
        const project = projectMap[String(maybeProjectId)];
        setCurrentProject(project);
        return;
      }

      const needle = projectMap[String(selection.projects[0])];
      if (needle) {
        setCurrentProject(needle);
        return;
      }
    }

    // Among the projects, find a project that has performance onboarding docs support, and has not sent
    // a first transaction event.
    const maybeProject = projects.find(project => {
      return (
        !project.firstTransactionEvent &&
        project.platform &&
        withPerformanceOnboarding.has(project.platform)
      );
    });

    if (maybeProject) {
      setCurrentProject(maybeProject);
      return;
    }

    setCurrentProject(projects[0]);
  }, [selection.projects, projects, isActive, isReady, currentProject]);

  if (
    !isActive ||
    !hasProjectAccess ||
    currentProject === undefined ||
    !projectsLoaded ||
    !projects ||
    projects.length <= 0
  ) {
    return null;
  }

  const items: MenuItemProps[] = projects.reduce((acc: MenuItemProps[], project) => {
    const itemProps: MenuItemProps = {
      key: project.id,
      label: <StyledIdBadge project={project} avatarSize={16} hideOverflow disableLink />,
      onAction: function switchProject() {
        setCurrentProject(project);
      },
    };

    if (currentProject.id === project.id) {
      acc.unshift(itemProps);
    } else {
      acc.push(itemProps);
    }

    return acc;
  }, []);

  return (
    <TaskSidebarPanel
      orientation={orientation}
      collapsed={collapsed}
      hidePanel={hidePanel}
    >
      <TopRightBackgroundImage src={HighlightTopRightPattern} />
      <TaskList>
        <Heading>{t('Boost Performance')}</Heading>
        <div>
          <DropdownMenuControlV2
            items={items}
            triggerLabel={
              <StyledIdBadge
                project={currentProject}
                avatarSize={32}
                hideOverflow
                disableLink
              />
            }
            triggerProps={{
              'aria-label': currentProject.slug,
              borderless: true,
            }}
            placement="bottom left"
          />
        </div>
        <OnboardingContent currentProject={currentProject} />
      </TaskList>
    </TaskSidebarPanel>
  );
}

function OnboardingContent({currentProject}: {currentProject: Project}) {
  const api = useApi();
  const organization = useOrganization();
  const previousProject = usePrevious(currentProject);
  const [received, setReceived] = useState<boolean>(false);

  useEffect(() => {
    if (previousProject.id !== currentProject.id) {
      setReceived(false);
    }
  }, [previousProject.id, currentProject.id]);

  const {docContents, isLoading, hasOnboardingContents} =
    usePerformanceOnboardingDocs(currentProject);

  const doesNotSupportPerformance = currentProject.platform
    ? withoutPerformanceSupport.has(currentProject.platform)
    : false;

  if (doesNotSupportPerformance) {
    return (
      <Fragment>
        <div>
          {t(
            'Fiddlesticks. Performance isn’t available for Elixir yet but we’re definitely still working on it. Stay tuned.'
          )}
        </div>
        <div>
          <Button size="small" href="https://docs.sentry.io/platforms/" external>
            {t('Go to Sentry Documentation')}
          </Button>
        </div>
      </Fragment>
    );
  }

  if (isLoading) {
    return <LoadingIndicator />;
  }

  const currentPlatform = currentProject.platform
    ? platforms.find(p => p.id === currentProject.platform)
    : undefined;
  if (!currentPlatform || !hasOnboardingContents) {
    return (
      <Fragment>
        <div>
          {t(
            'Fiddlesticks. This checklist isn’t available for this project yet, but for now, go to Sentry docs for installation details.'
          )}
        </div>
        <div>
          <Button
            size="small"
            href="https://docs.sentry.io/product/performance/getting-started/"
            external
          >
            {t('Install')}
          </Button>
        </div>
      </Fragment>
    );
  }

  const docKeys = generateOnboardingDocKeys(currentPlatform.id);

  return (
    <Fragment>
      <div>
        {tct(
          `Adding performance to your [platform] project is simple. Make sure you've got these basics down.`,
          {platform: currentPlatform?.name || currentProject.slug}
        )}
      </div>
      {docKeys.map((docKey, index) => {
        let footer: React.ReactNode = null;

        if (index === 2) {
          footer = (
            <EventWaiter
              api={api}
              organization={organization}
              project={currentProject}
              eventType="transaction"
              onIssueReceived={() => {
                setReceived(true);
              }}
            >
              {() => (received ? <EventReceivedIndicator /> : <EventWaitingIndicator />)}
            </EventWaiter>
          );
        }
        return (
          <div key={index}>
            <OnBoardingStep
              docKey={docKey}
              project={currentProject}
              docContent={docContents[docKey]}
            />
            {footer}
          </div>
        );
      })}
    </Fragment>
  );
}

const TaskSidebarPanel = styled(SidebarPanel)`
  width: 450px;
`;

const TopRightBackgroundImage = styled('img')`
  position: absolute;
  top: 0;
  right: 0;
  width: 60%;
  user-select: none;
`;

const TaskList = styled('div')`
  display: grid;
  grid-auto-flow: row;
  gap: ${space(1)};
  margin: 50px ${space(4)} ${space(4)} ${space(4)};
`;

const Heading = styled('div')`
  display: flex;
  color: ${p => p.theme.purple300};
  font-size: ${p => p.theme.fontSizeExtraSmall};
  text-transform: uppercase;
  font-weight: 600;
  line-height: 1;
  margin-top: ${space(3)};
`;

const StyledIdBadge = styled(IdBadge)`
  overflow: hidden;
  white-space: nowrap;
  flex-shrink: 1;
`;

const PulsingIndicator = styled('div')`
  ${pulsingIndicatorStyles};
  margin-right: ${space(1)};
`;

const EventWaitingIndicator = styled((p: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...p}>
    <PulsingIndicator />
    {t(`Waiting for this project's first transaction event`)}
  </div>
))`
  display: flex;
  align-items: center;
  flex-grow: 1;
  font-size: ${p => p.theme.fontSizeMedium};
  color: ${p => p.theme.pink300};
`;

const EventReceivedIndicator = styled((p: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...p}>
    {'🎉 '}
    {t(`We've received this project's first transaction event!`)}
  </div>
))`
  display: flex;
  align-items: center;
  flex-grow: 1;
  font-size: ${p => p.theme.fontSizeMedium};
  color: ${p => p.theme.green300};
`;

export default PerformanceOnboardingSidebar;
