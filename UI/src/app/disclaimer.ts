import { Component, ElementRef, viewChild } from '@angular/core';

@Component({
    selector: 'app-disclaimer',
    templateUrl: './disclaimer.html',
    styleUrl: './disclaimer.css',
})
export class Disclaimer {
    private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('disclaimerDialog');

    open(): void {
        const dialog = this.dialog()?.nativeElement;
        if (dialog && !dialog.open) {
            dialog.showModal();
            dialog.scrollTop = 0;
        }
    }

    close(): void {
        this.dialog()?.nativeElement.close();
    }
}
