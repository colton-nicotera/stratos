import { ApplicationsPage } from '../applications/applications.po';
import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { SideNavigation, SideNavMenuItem } from '../po/side-nav.po';
import { ApplicationE2eHelper } from './application-e2e-helpers';
import { ApplicationSummary } from './application-summary.po';
import { CreateApplicationStepper } from './create-application-stepper.po';
import { CFHelpers } from '../helpers/cf-helpers';
import { ExpectedConditions } from 'protractor';


fdescribe('Application Delete', function () {

  let nav: SideNavigation;
  let appWall: ApplicationsPage;
  let applicationE2eHelper: ApplicationE2eHelper;
  let cfGuid, app;
  let cfHelper: CFHelpers;
  let testAppName;

  beforeAll(() => {
    nav = new SideNavigation();
    appWall = new ApplicationsPage();
    const setup = e2e.setup(ConsoleUserType.user)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.user)
      .connectAllEndpoints(ConsoleUserType.admin)
      .getInfo(ConsoleUserType.admin)
    applicationE2eHelper = new ApplicationE2eHelper(setup);
    cfHelper = new CFHelpers(setup);
  });

  beforeEach(() => nav.goto(SideNavMenuItem.Applications));

  // Delete tests for a simple app with no routes
  describe('Simple App', () => {
    beforeAll(() => {
      const endpointName = e2e.secrets.getDefaultCFEndpoint().name;
      cfGuid = e2e.helper.getEndpointGuid(e2e.info, endpointName);
      const testTime = (new Date()).toISOString();
      testAppName = ApplicationE2eHelper.createApplicationName(testTime);
      return applicationE2eHelper.createApp(cfGuid, e2e.secrets.getDefaultCFEndpoint().testSpace, testAppName).then(appl => {
        app = appl;
      });
    });

    afterAll(() => applicationE2eHelper.deleteApplication(cfGuid, app));

    it('Should return to summary page after cancel', () => {
      const appSummaryPage = new ApplicationSummary(cfGuid, app.metadata.guid, app.entity.name);
      appSummaryPage.navigateTo();
      appSummaryPage.waitForPage();
      // Open delete app dialog
      const deleteApp = appSummaryPage.delete();
      // App did not have a route, so there should be no routes step
      expect(deleteApp.hasRouteStep()).toBeFalsy();
      // 1 step - np header shown
      expect(deleteApp.stepper.canCancel()).toBeTruthy();
      expect(deleteApp.stepper.canNext()).toBeTruthy();
      expect(deleteApp.stepper.hasPrevious()).toBeFalsy();

      deleteApp.stepper.cancel();
      appSummaryPage.waitForPage();
    });

    it('Should delete app', () => {
      // We should be on the app wall
      expect(appWall.isActivePage()).toBeTruthy();

      // We created the app after the wall loaded, so refresh to make sure app wall shows the new app
      appWall.appList.refresh();

      let appCount = 0;
      appWall.appList.getTotalResults().then(count => appCount = count);

      e2e.sleep(5000);

      // Open delete app dialog
      const appSummaryPage = new ApplicationSummary(cfGuid, app.metadata.guid, app.entity.name);
      appSummaryPage.navigateTo();
      appSummaryPage.waitForPage();
      const deleteApp = appSummaryPage.delete();

      // App did not have a route, so there should be no routes step
      expect(deleteApp.hasRouteStep()).toBeFalsy();

      // 1 step - np header shown
      expect(deleteApp.stepper.canCancel()).toBeTruthy();
      expect(deleteApp.stepper.canNext()).toBeTruthy();
      expect(deleteApp.stepper.hasPrevious()).toBeFalsy();

      deleteApp.table.getTableData().then(table => {
        expect(table.length).toBe(1);
        expect(table[0].name).toBe(testAppName);
        expect(table[0].instances).toBe('0 / 1');
      });

      expect(deleteApp.stepper.getNextLabel()).toBe('Delete');

      // Delete the app
      deleteApp.stepper.next();

      deleteApp.stepper.waitUntilCanClose();
      expect(deleteApp.stepper.getNextLabel()).toBe('Close');
      // Close
      deleteApp.stepper.next();

      // Should go back to app wall
      appWall.waitForPage();

      e2e.sleep(5000);


      // We deleted the app, so don't try and do this on cleanup
      app = null;

      // Check that we have 1 less app
      appWall.appList.getTotalResults().then(count =>expect(count).toBe(appCount - 1));
    });
  });


});
