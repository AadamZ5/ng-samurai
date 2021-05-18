import * as path from 'path';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { Style, Schema as ApplicationOptions } from '@schematics/angular/application/schema';
import { Schema as LibraryOptions } from '@schematics/angular/library/schema';
import { Schema as WorkspaceOptions } from '@schematics/angular/workspace/schema';

const workspaceOptions: WorkspaceOptions = {
  name: 'some-workspace',
  newProjectRoot: 'projects',
  version: '8.0.0'
};

const appOptions: ApplicationOptions = {
  name: 'some-app',
  inlineStyle: false,
  inlineTemplate: false,
  routing: false,
  style: Style.Css,
  skipTests: false,
  skipPackageJson: false
};

const libOptions: LibraryOptions = {
  name: 'some-lib'
};

const defaultOptions: any = {
  name: 'test-library-item/ice-Cream-----machine-galore/cone-generator'
};

const collectionPath = path.join(__dirname, '../collection.json');
const runner = new SchematicTestRunner('schematics', collectionPath);

let appTree: UnitTestTree;

describe('generate-subentry', () => {
  beforeEach(async () => {
    appTree = await runner
      .runExternalSchematicAsync('@schematics/angular', 'workspace', workspaceOptions)
      .toPromise();
    appTree = await runner
      .runExternalSchematicAsync('@schematics/angular', 'library', libOptions, appTree)
      .toPromise();
    appTree = await runner
      .runExternalSchematicAsync('@schematics/angular', 'application', appOptions, appTree)
      .toPromise();
  });

  it('should generate a CustomerComponent', async () => {
    const options = { ...defaultOptions };
    const segments = options.name.split('/');
    const expectedFile = segments[segments.length - 1];

    const tree = await runner.runSchematicAsync('generate-subentry', options, appTree).toPromise();

    expect(
      tree.files.includes(`/projects/some-lib/src/lib/${options.name}/${expectedFile}.component.ts`)
    ).toBe(true);
  });

  it('should generate a CustomerModule and add a CustomerComponent', async () => {
    const options = { ...defaultOptions };

    const segments = options.name.split('/');
    const expectedFile = segments[segments.length - 1];
    let v = expectedFile.split('-');
    v.forEach((w: string, i: number) => {
      v[i] = v[i][0].toUpperCase() + v[i].substring(1);
    });
    v = v.join('');

    const tree = await runner.runSchematicAsync('generate-subentry', options, appTree).toPromise();

    expect(
      tree.files.includes(`/projects/some-lib/src/lib/${options.name}/${expectedFile}.module.ts`)
    ).toBe(true);
    expect(
      tree
        .readContent(`/projects/some-lib/src/lib/${options.name}/${expectedFile}.module.ts`)
        .includes(v)
    ).toBe(true);
  });

  it('should export everything from public-api inside index.ts', async () => {
    const options = { ...defaultOptions };
    const expectedContent = "export * from './public-api';\n";

    const tree = await runner.runSchematicAsync('generate-subentry', options, appTree).toPromise();
    expect(tree.readContent(`/projects/some-lib/src/lib/${options.name}/index.ts`)).toEqual(
      expectedContent
    );
  });

  it('should export the CustomerComponent and the CustomerModule from public-api', async () => {
    const options = { ...defaultOptions };
    const segments = options.name.split('/');
    const expectedFile = segments[segments.length - 1];
    const expectedContent = `export * from './${expectedFile}.module';\nexport * from './${expectedFile}.component';\n`;

    const tree = await runner.runSchematicAsync('generate-subentry', options, appTree).toPromise();
    expect(tree.readContent(`/projects/some-lib/src/lib/${options.name}/public-api.ts`)).toEqual(
      expectedContent
    );
  });

  it('should add a package.json with the generate-subentry config', async () => {
    const options = { ...defaultOptions };
    const expectedContent = {
      ngPackage: {
        lib: {
          entryFile: 'public-api.ts',
          cssUrl: 'inline'
        }
      }
    };

    const tree = await runner.runSchematicAsync('generate-subentry', options, appTree).toPromise();
    expect(
      JSON.parse(tree.readContent(`/projects/some-lib/src/lib/${options.name}/package.json`))
    ).toEqual(expectedContent);
  });
});
