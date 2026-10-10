import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { Disclaimer } from './disclaimer';

it('opens the disclaimer from its button and closes it with the dialog controls', () => {
    const fixture = TestBed.createComponent(Disclaimer);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const dialog = root.querySelector('dialog')!;
    const show = vi.fn(() => dialog.setAttribute('open', ''));
    const close = vi.fn(() => dialog.removeAttribute('open'));
    dialog.showModal = show;
    dialog.close = close;
    root.querySelector<HTMLButtonElement>('.disclaimer-button')!.click();
    expect(show).toHaveBeenCalledTimes(1);
    expect(dialog.open).toBe(true);
    expect(dialog.textContent).toContain('a spiritual art');
    expect(dialog.textContent).toContain('not a substitute for medical analysis');
    expect(dialog.textContent).toContain('Your health and the target’s health are your responsibility');
    root.querySelector<HTMLButtonElement>('.close-button')!.click();
    expect(close).toHaveBeenCalledTimes(1);
    expect(dialog.open).toBe(false);
    fixture.destroy();
});
