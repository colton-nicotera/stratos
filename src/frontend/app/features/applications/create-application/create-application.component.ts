import { Component, OnInit } from '@angular/core';
import { OnDestroy } from '@angular/core/src/metadata/lifecycle_hooks';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs/Subscription';

import { CfAppsDataSource } from '../../../shared/components/list/list-types/app/cf-apps-data-source';
import { CfOrgSpaceDataService, CfOrgSpaceSelectMode } from '../../../shared/data-services/cf-org-space-service.service';
import { AppState } from '../../../store/app-state';
import { selectPaginationState } from '../../../store/selectors/pagination.selectors';
import { applicationSchemaKey } from '../../../store/helpers/entity-factory';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';

@Component({
  selector: 'app-create-application',
  templateUrl: './create-application.component.html',
  styleUrls: ['./create-application.component.scss'],
  providers: [
    {
      provide: CfOrgSpaceDataService,
      useFactory: (store: Store<AppState>, paginationMonitorFactory: PaginationMonitorFactory) => {
        return new CfOrgSpaceDataService(store, paginationMonitorFactory, CfOrgSpaceSelectMode.ANY, false);
      },
      deps: [Store, PaginationMonitorFactory]
    }
  ],
})
export class CreateApplicationComponent implements OnInit, OnDestroy {

  paginationStateSub: Subscription;
  constructor(private store: Store<AppState>, public cfOrgSpaceService: CfOrgSpaceDataService) { }

  ngOnInit() {
    // We will auto select endpoint/org/space that have been selected on the app wall.
    const appWallPaginationState = this.store.select(selectPaginationState(applicationSchemaKey, CfAppsDataSource.paginationKey));
    this.paginationStateSub = appWallPaginationState.filter(pag => !!pag).first().do(pag => {
      let cfs, orgs, spaces;
      cfs = pag.clientPagination.filter.items.cf;
      if (cfs && cfs.length === 1) {
        this.cfOrgSpaceService.cf.select.next(cfs);
        orgs = pag.clientPagination.filter.items.org;
        if (orgs && orgs.length === 1) {
          this.cfOrgSpaceService.org.select.next(orgs);
          spaces = pag.clientPagination.filter.items.space;
          if (spaces && spaces.length === 1) {
            this.cfOrgSpaceService.space.select.next(spaces);
          }
        }
      }
    }).subscribe();
  }
  ngOnDestroy(): void {
    this.paginationStateSub.unsubscribe();
  }

}
