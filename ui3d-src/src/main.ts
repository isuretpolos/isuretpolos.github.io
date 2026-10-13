import {isDevMode} from '@angular/core';
import {bootstrapApplication} from '@angular/platform-browser';
import {provideServiceWorker} from '@angular/service-worker';
import {WorkspaceComponent} from './app/pages/workspace.component';

bootstrapApplication(WorkspaceComponent, {
    providers: [provideServiceWorker('ngsw-worker.js', {
        enabled: !isDevMode(), scope: '/ui3d/', registrationStrategy: 'registerImmediately'
    })]
}).catch(console.error);
