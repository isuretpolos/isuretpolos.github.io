import { Component, input } from '@angular/core';

@Component({
    selector: 'app-icon',
    template: `<svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
    >
        <path [attr.d]="paths[name()] || paths['list']" />
    </svg>`,
    styles: [
        ' :host { display: inline-flex; width: 1.5rem; height: 1.5rem; flex-shrink: 0; } svg { width: 100%; height: 100%; }',
    ],
})
export class Icon {
    readonly name = input('list');
    readonly paths: Record<string, string> = {
        list: 'M6 3h8l4 4v14H6z M14 3v5h4 M9 12h6 M9 16h6',
        camera: 'M3 7h4l2-3h6l2 3h4v13H3z M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
        wave: 'M2 12h4l3-8 4 16 3-8h6',
        bars: 'M4 20V11h3v9z M10 20V4h3v16z M16 20V8h3v12z',
        settings: 'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1z M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
        arrow: 'M4 12h16 M14 6l6 6-6 6',
    };
}
