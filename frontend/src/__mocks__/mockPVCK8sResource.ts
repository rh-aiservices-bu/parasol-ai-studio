import { KnownLabels, PersistentVolumeClaimKind } from '~/k8sTypes';
import { genUID } from '~/__mocks__/mockUtils';

type MockResourceConfigType = {
  name?: string;
  namespace?: string;
  storage?: string;
  displayName?: string;
  uid?: string;
};

export const mockPVCK8sResource = ({
  name = 'test-storage',
  namespace = 'test-project',
  storage = '5Gi',
  displayName = 'Test Storage',
  uid = genUID('pvc'),
}: MockResourceConfigType): PersistentVolumeClaimKind => ({
  kind: 'PersistentVolumeClaim',
  apiVersion: 'v1',
  metadata: {
    annotations: {
      'openshift.io/description': '',
      'openshift.io/display-name': displayName,
    },
    name,
    namespace,
    labels: {
      [KnownLabels.DASHBOARD_RESOURCE]: 'true',
    },
    uid,
  },
  spec: {
    accessModes: ['ReadWriteOnce'],
    resources: {
      requests: {
        storage,
      },
    },
    volumeName: 'pvc-8644e33b-a710-45a3-9d54-7f987494643a',
    storageClassName: 'gp3',
    volumeMode: 'Filesystem',
  },
  status: {
    phase: 'Bound',
    accessModes: ['ReadWriteOnce'],
    capacity: {
      storage,
    },
  },
});
