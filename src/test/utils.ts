/* eslint-disable vue/one-component-per-file */
import {
  defineComponent,
  h,
  type Component,
  type ComponentPublicInstance,
  type DefineComponent,
} from 'vue';
import { mount, type MountingOptions } from '@vue/test-utils';
import { expect, vi } from 'vitest';

export const createStubComponent = (
  name: string,
  options: {
    props?: string[];
    slots?: string[];
    emits?: string[];
    render?: (props: Record<string, unknown>) => ReturnType<typeof h>;
  },
): DefineComponent => {
  return defineComponent({
    name: `${name}Stub`,
    props: options.props,
    emits: options.emits,
    setup(
      props: Record<string, unknown>,
      {
        slots,
        emit,
      }: {
        slots: Record<string, () => ReturnType<typeof h>>;
        emit: (e: string, ...args: unknown[]) => void;
      },
    ) {
      const renderProps = {
        ...props,
        emit,
      };
      if (options.render) {
        return options.render(renderProps);
      }
      return () =>
        h(
          'div',
          {
            'data-testid': name
              .replace(/([A-Z])/g, '-$1')
              .toLowerCase()
              .slice(1),
          },
          slots.default?.(),
        );
    },
  });
};

export const createMockFn = <T extends (...args: unknown[]) => unknown>(
  mockImplementation?: T,
) => {
  return vi.fn(mockImplementation);
};

export const createSpies = <
  T extends Record<string, (...args: unknown[]) => unknown>,
>(
  spyMap: T,
): Record<keyof T, ReturnType<typeof vi.fn>> => {
  const result: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const key in spyMap) {
    result[key] = vi.fn(spyMap[key]);
  }
  return result as Record<keyof T, ReturnType<typeof vi.fn>>;
};

export const mountWithStubs = <T extends ComponentPublicInstance>(
  component: Component,
  options?: MountingOptions<T>,
) => {
  const defaultStubs = {
    NTooltip: defineComponent({
      name: 'NTooltipStub',
      setup(
        _: unknown,
        { slots }: { slots: Record<string, () => ReturnType<typeof h>> },
      ) {
        return () => h('div', [slots.trigger?.(), slots.default?.()]);
      },
    }),
    NButton: defineComponent({
      name: 'NButtonStub',
      emits: ['click'],
      setup(
        _: unknown,
        {
          emit,
          slots,
        }: {
          emit: (e: string) => void;
          slots: Record<string, () => ReturnType<typeof h>>;
        },
      ) {
        return () =>
          h(
            'button',
            {
              type: 'button',
              onClick: () => emit('click'),
            },
            slots.default?.(),
          );
      },
    }),
    SvgIcon: defineComponent({
      name: 'SvgIconStub',
      props: ['name'],
      setup(props: { name: string }) {
        return () => h('span', { 'data-testid': `svg-${props.name}` });
      },
    }),
  };

  return mount(component, {
    global: {
      stubs: {
        ...defaultStubs,
        ...options?.global?.stubs,
      },
    },
    ...options,
  });
};

export const waitForComponentToMount = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

export const triggerClick = async (
  wrapper: ReturnType<typeof mount>,
  selector: string,
): Promise<void> => {
  await wrapper.find(selector).trigger('click');
};

export const expectElementExists = (
  wrapper: ReturnType<typeof mount>,
  selector: string,
  exists: boolean = true,
): void => {
  expect(wrapper.find(selector).exists()).toBe(exists);
};

export const expectElementText = (
  wrapper: ReturnType<typeof mount>,
  selector: string,
  text: string | RegExp,
): void => {
  const element = wrapper.find(selector);
  expect(element.exists()).toBe(true);
  if (typeof text === 'string') {
    expect(element.text()).toBe(text);
  } else {
    expect(element.text()).toMatch(text);
  }
};

export const expectSpyCalled = (
  spy: ReturnType<typeof vi.fn>,
  times?: number,
  ...args: unknown[]
): void => {
  if (times !== undefined) {
    expect(spy).toHaveBeenCalledTimes(times);
  }
  if (args.length > 0) {
    expect(spy).toHaveBeenCalledWith(...args);
  } else {
    expect(spy).toHaveBeenCalled();
  }
};

export const expectSpyNotCalled = (spy: ReturnType<typeof vi.fn>): void => {
  expect(spy).not.toHaveBeenCalled();
};
