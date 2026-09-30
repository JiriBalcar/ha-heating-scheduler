import { css, html, nothing } from "lit";
import { showDialog } from "../ha";
import { languageOf, translator } from "../i18n";
import { HOUSE_ICONS } from "../modes";
import { HOUSE_MODES, type HouseMode, type ZoneData } from "../types";
import { define } from "./define";
import { HsHaDialog } from "./hs-dialog";

export type Replacements = Partial<Record<HouseMode, HouseMode>>;

export interface ZoneModes {
  modes: HouseMode[];
  replacements: Replacements;
}

interface ZoneModesParams {
  zone: ZoneData;
  resolve: (choice: ZoneModes | null) => void;
}

// The modes a zone may leave out: Normal is always there.
const OPTIONAL: HouseMode[] = ["away", "vacation", "frost", "off"];
// A replacement has no dates, so it is never Holiday.
const PLAIN: HouseMode[] = ["auto", "away", "frost", "off"];

/** A replacement for each mode left out: the one chosen, while the zone offers it, else Normal. */
export function fitReplacements(modes: HouseMode[], replacements: Replacements): Replacements {
  const out: Replacements = {};
  for (const mode of OPTIONAL) {
    if (modes.includes(mode)) continue;
    const chosen = replacements[mode];
    out[mode] = chosen && PLAIN.includes(chosen) && modes.includes(chosen) ? chosen : "auto";
  }
  return out;
}

/**
 * The modes a zone offers. For each mode it leaves out, the zone runs another mode instead when
 * the whole house gets that mode.
 */
export class HsZoneModesDialog extends HsHaDialog<ZoneModesParams> {
  static override properties = {
    modes: { state: true },
    replacements: { state: true },
  };
  declare modes: HouseMode[];
  declare replacements: Replacements;
  private result: ZoneModes | null = null;

  static override styles = css`
    p {
      margin: 0 0 var(--ha-space-2, 8px);
      color: var(--secondary-text-color);
    }
    ha-settings-row {
      padding: 0;
    }
    /* Under the mode's name: past its icon (24 px) and the gap (12 px). */
    ha-settings-row.instead {
      padding-inline-start: 36px;
    }
    .mode {
      display: flex;
      align-items: center;
      gap: var(--ha-space-3, 12px);
    }
  `;

  protected override dialogOpened(params: ZoneModesParams): void {
    this.modes = [...params.zone.modes];
    this.replacements = fitReplacements(this.modes, params.zone.replacements);
    this.result = null;
  }

  protected override dialogClosed(): void {
    this.args?.resolve(this.result);
  }

  private get t() {
    return translator(languageOf(this.hass));
  }

  private offer(mode: HouseMode, offered: boolean) {
    this.modes = HOUSE_MODES.filter((item) => (item === mode ? offered : this.modes.includes(item)));
    this.replacements = fitReplacements(this.modes, this.replacements);
  }

  private save() {
    this.result = { modes: this.modes, replacements: this.replacements };
    this.closeDialog();
  }

  private row(mode: HouseMode) {
    const t = this.t;
    const offered = this.modes.includes(mode);
    const choices = PLAIN.filter((item) => this.modes.includes(item)).map((item) => ({
      value: item,
      label: t(`house.${item}`),
    }));
    return html`<ha-settings-row>
        <span slot="heading" class="mode">
          <ha-svg-icon .path=${HOUSE_ICONS[mode]}></ha-svg-icon>${t(`house.${mode}`)}
        </span>
        <ha-switch
          .checked=${offered}
          aria-label=${t(`house.${mode}`)}
          @change=${(e: Event) => this.offer(mode, (e.target as HTMLInputElement).checked)}
        ></ha-switch>
      </ha-settings-row>
      ${offered
        ? nothing
        : html`<ha-settings-row class="instead">
            <span slot="heading">${t("adv.zones.instead")}</span>
            <ha-select
              .options=${choices}
              .value=${this.replacements[mode] ?? "auto"}
              @selected=${(e: CustomEvent<{ value?: string }>) => {
                if (e.detail.value) this.replacements = { ...this.replacements, [mode]: e.detail.value as HouseMode };
              }}
            ></ha-select>
          </ha-settings-row>`}`;
  }

  override render() {
    if (!this.args || !this.hass) return nothing;
    const t = this.t;
    return html`
      <ha-dialog
        .open=${this.open}
        header-title=${t("adv.zones.modes_title", { zone: this.args.zone.name })}
        @closed=${this.onClosed}
      >
        <p>${t("adv.zones.modes_hint")}</p>
        ${OPTIONAL.map((mode) => this.row(mode))}
        <ha-dialog-footer slot="footer">
          <ha-button slot="secondaryAction" appearance="plain" @click=${() => this.closeDialog()}>
            ${t("common.cancel")}
          </ha-button>
          <ha-button slot="primaryAction" @click=${this.save}>${t("common.save")}</ha-button>
        </ha-dialog-footer>
      </ha-dialog>
    `;
  }
}

define("hs-zone-modes-dialog", HsZoneModesDialog);

/** Ask for the modes a zone offers. Resolves the choice, or null when cancelled. */
export function chooseZoneModes(host: HTMLElement, zone: ZoneData): Promise<ZoneModes | null> {
  return new Promise((resolve) => showDialog(host, "hs-zone-modes-dialog", { zone, resolve }));
}
