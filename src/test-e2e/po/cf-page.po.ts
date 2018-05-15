import { promise } from 'protractor';
import { NoContentComponent } from './no-content.po';
import { Page } from './page.po';

/**
 * Base CF Page Object can be inherited by appropriate pages
 */
export abstract class CFPage extends Page {

  noContent = new NoContentComponent();

  constructor(navLink?: string) {
    super(navLink);
  }

  hasNoCloudFoundryMesasge(): promise.Promise<boolean> {
    return this.noContent.isPresent().then(() => {
      return this.noContent.checkFirstLineMessage('There are no connected Cloud Foundry endpoints');
    });
  }
}

