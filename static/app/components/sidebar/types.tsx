export type SidebarOrientation = 'top' | 'left';

export enum SidebarPanelKey {
  Broadcasts = 'broadcasts',
  OnboardingWizard = 'todos',
  StatusUpdate = 'statusupdate',
  PerformanceOnboarding = 'performance_onboarding',
}

export type CommonSidebarProps = {
  collapsed: boolean;
  currentPanel: SidebarPanelKey | '';
  hidePanel: () => void;
  onShowPanel: () => void;
  orientation: SidebarOrientation;
};
