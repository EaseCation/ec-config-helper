import { useEffect, useState } from 'react';
import {
  DEFAULT_ECAPI_BASE_URL,
  getEcapiApiKey,
  getEcapiBaseUrl,
  setEcapiApiKey,
  setEcapiBaseUrl,
} from '../services/ecapi/ecapiSettings';

export function useEcapiSettings() {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [baseUrl, setBaseUrlState] = useState<string>(DEFAULT_ECAPI_BASE_URL);

  useEffect(() => {
    setApiKeyState(getEcapiApiKey());
    setBaseUrlState(getEcapiBaseUrl());
  }, []);

  const updateApiKey = (value: string | null) => {
    setEcapiApiKey(value);
    setApiKeyState(getEcapiApiKey());
  };

  const updateBaseUrl = (value: string | null) => {
    setEcapiBaseUrl(value);
    setBaseUrlState(getEcapiBaseUrl());
  };

  return {
    apiKey,
    baseUrl,
    setApiKey: updateApiKey,
    setBaseUrl: updateBaseUrl,
  };
}
