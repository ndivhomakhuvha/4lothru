# 4lothru

Install the SDK and CLI from one self-contained package:

```bash
npm install 4lothru
```

Initialize the browser SDK once at app startup:

```ts
import { Trail } from "4lothru";

Trail.init();
```

The CLI is available as `4lothru`:

```bash
npx 4lothru validate
npx 4lothru build
npx 4lothru preview
```
