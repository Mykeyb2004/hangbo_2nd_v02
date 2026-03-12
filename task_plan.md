# Task Plan: Report Unlock Gate

## Goal
在现有报告站点前增加一个“手机数字解锁”入口页，通过服务端校验 PIN 和短期 cookie 控制报告访问；保持当前报告页风格连续，不引入数据库或完整账号体系。

## Current Phase
Phase 5

## Phases

### Phase 1: Discovery & Access Design
- [x] Re-check report entry, layout, and styling boundaries
- [x] Define a server-side PIN verification flow that does not expose the PIN to client code
- [x] Record security scope, assumptions, and UX constraints
- **Status:** complete

### Phase 2: Unlock Flow Implementation
- [x] Add server-side unlock verification and cookie helpers
- [x] Gate the report route so locked sessions do not render report content
- [x] Preserve existing archive query parameter behavior after unlock
- **Status:** complete

### Phase 3: Unlock UI Integration
- [x] Build a mobile lock-screen style keypad UI consistent with the current report visual language
- [x] Add loading, error, and retry feedback for invalid PIN entry
- [x] Ensure mobile and desktop layouts remain usable and visually coherent
- **Status:** complete

### Phase 4: Documentation & Component Registry
- [x] Update `docs/component.md` for any created or modified components
- [x] Capture implementation decisions and verification notes in planning files
- **Status:** complete

### Phase 5: Verification & Delivery
- [x] Run targeted build/type verification
- [x] Manually verify locked and unlocked flows
- [x] Summarize outcome and residual security limits
- **Status:** complete

## Key Questions
1. 解锁门槛应该在页面渲染前拦截，还是仅做前端遮罩？
2. 在没有数据库的前提下，PIN 该放在哪一层，才能不泄露到前端 bundle？
3. 手机解锁风格如何借用现有玻璃拟态、蓝橙点缀和字体体系，而不是做成割裂的新页面？

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| 采用服务端环境变量保存 PIN，而不是前端硬编码或 `NEXT_PUBLIC_*` | 避免查看前端源码时直接泄露 PIN |
| 采用短期 `HttpOnly` cookie 记录解锁状态 | 满足“轻量保密”目标，不引入数据库或用户体系 |
| 解锁成功前不渲染报告主体 | 避免报告数据已进入客户端后再做纯前端遮罩 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| 本地 `next dev` 在沙箱内监听端口报 `EPERM` | 1 | 使用提权启动本地服务完成 Playwright 验证 |
| 调试过程中浏览器保留了上一次人工输入 PIN 后的 cookie | 1 | 通过 Playwright 清空 cookie 后重新验证锁屏链路 |

## Notes
- 目标是“低强度访问门槛”，不是高安全鉴权系统
- 改动涉及组件创建/修改时，需同步维护 `docs/component.md`
