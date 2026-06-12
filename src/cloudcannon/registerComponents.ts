// Registers every page-builder widget for live re-rendering in CloudCannon's
// Visual Editor. Loaded only inside the editor iframe (see the conditional
// dynamic import in src/layouts/Layout.astro).
//
// componentMap is the single source of truth shared with BlockRenderer.astro,
// so the registration keys always match the `_type` discriminator in content
// files (e.g. `_type: call_to_action` -> registers under 'call_to_action').
import { registerAstroComponent } from '@cloudcannon/editable-regions/astro';
import { componentMap } from './componentMap';

for (const [type, Component] of Object.entries(componentMap)) {
  registerAstroComponent(type, Component);
}

// Shared partials backed by the navigation data file. Registered so sidebar/data
// edits to navigation.json re-render the Header/Footer live in the editor.
import Header from '~/components/widgets/Header.astro';
import Footer from '~/components/widgets/Footer.astro';

registerAstroComponent('header', Header);
registerAstroComponent('footer', Footer);
