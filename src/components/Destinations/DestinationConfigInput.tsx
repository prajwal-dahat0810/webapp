import {
  Autocomplete,
  Box,
  IconButton,
  InputAdornment,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import MultiTagInput from '../MultiTagInput';
import { Controller } from 'react-hook-form';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';

export interface DestinationConfigInputprops {
  specs: Array<any>;
  registerFormFieldValue: (...args: any) => any;
  control: any;
  setFormValue: (...args: any) => any;
  unregisterFormField: (...args: any) => any;
}

export const DestinationConfigInput = ({
  specs,
  registerFormFieldValue,
  control,
  setFormValue,
  unregisterFormField,
}: DestinationConfigInputprops) => {
  const [connectorSpecs, setConnectorSpecs] = useState<any>([]);
  const [showPasswords, setShowPasswords] = useState<any>({});

  const handleClickShowPassword = (field: string) => {
    const tempShowPasswords: any = { ...showPasswords };
    tempShowPasswords[field] = !showPasswords[field];
    setShowPasswords(tempShowPasswords);
  };

  const handleObjectFieldOnChange = (
    dropDownVal: any,
    field: string,
    fieldOnChangeFunc: any
  ) => {
    fieldOnChangeFunc.onChange(dropDownVal);

    // Fetch the current selected spec of type object based on selection
    const selectedSpec: any = connectorSpecs.find(
      (ele: any) => ele.field === field
    );

    // Filter all specs that are under selectedSpec and have parent as selectedSpec
    // Check if any child specs has type object
    const filteredChildSpecs: any = [];
    selectedSpec?.specs.forEach((ele: any) => {
      if (ele.parent === dropDownVal) {
        // Check if the child has another level or not
        if (ele?.specs && ele?.enum.length === 0) {
          ele.specs.forEach((childEle: any) => {
            filteredChildSpecs.push({ ...childEle, order: ele.order });
          });
        } else {
          filteredChildSpecs.push(ele);
        }
      }
    });

    // Set the order of child specs to be displayed at correct position
    filteredChildSpecs.forEach((ele: any) => {
      ele.order = selectedSpec.order;
    });
    // Update the specs state

    // Find the specs that will have parent in the following enum array
    const enumsToRemove: string[] = selectedSpec?.enum.filter(
      (ele: any) => ele !== dropDownVal
    );

    const tempSpecs = connectorSpecs
      .filter((sp: any) => !enumsToRemove.includes(sp?.parent))
      .concat(filteredChildSpecs);

    // Unregister the form fields that have parent in enumsToRemove
    connectorSpecs.forEach((sp: any) => {
      if (enumsToRemove.includes(sp?.parent)) unregisterFormField(sp?.field);
    });

    setConnectorSpecs(tempSpecs);
  };

  useEffect(() => {
    setConnectorSpecs(specs);
  }, [specs]);

  useEffect(() => {
    const tempShowPasswords: any = {};
    specs.forEach((element) => {
      if (element?.airbyte_secret) {
        tempShowPasswords[element.field] = false;
      }
    });
    setShowPasswords(tempShowPasswords);
  }, [specs]);
  return (
    <>
      {connectorSpecs
        .sort((input1: any, input2: any) => {
          if (!input2.order) return -1;
          if (!input1.order) return -1;
          return input1.order - input2.order;
        })
        ?.map((spec: any, idx: number) =>
          spec.type === 'string' ? (
            spec?.const ? ( // type == string and a const selected value
              <React.Fragment key={idx}>
                <TextField
                  sx={{ width: '100%' }}
                  label={spec.const}
                  variant="outlined"
                  value={spec?.const}
                  {...registerFormFieldValue(spec.field, {
                    required: spec.required,
                  })}
                ></TextField>
                <Box sx={{ m: 2 }} />
              </React.Fragment>
            ) : spec.airbyte_secret ? ( // type == string and a password/secret field
              <React.Fragment key={idx}>
                <TextField
                  sx={{ width: '100%' }}
                  label={spec?.title}
                  variant="outlined"
                  type={showPasswords[spec.field] ? 'text' : 'password'}
                  {...registerFormFieldValue(spec.field, {
                    required: spec.required,
                  })}
                  defaultValue={spec?.default}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Box>
                          <IconButton
                            onClick={() => handleClickShowPassword(spec.field)}
                            edge="end"
                          >
                            {showPasswords[spec.field] ? (
                              <VisibilityOutlinedIcon />
                            ) : (
                              <VisibilityOffOutlinedIcon />
                            )}
                          </IconButton>
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                ></TextField>
                <Box sx={{ m: 2 }} />
              </React.Fragment>
            ) : spec?.enum?.length > 0 ? ( // type == string and a dropdown select
              <React.Fragment key={idx}>
                <Controller
                  name={spec.field}
                  control={control}
                  rules={{ required: spec?.required }}
                  render={({ field }) => (
                    <Autocomplete
                      options={spec?.enum}
                      onChange={(e, data: any) => {
                        field.onChange(data);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          variant="outlined"
                          label={spec.title}
                        />
                      )}
                    />
                  )}
                />
                <Box sx={{ m: 2 }} />
              </React.Fragment>
            ) : (
              // type == string , default
              <React.Fragment key={idx}>
                <TextField
                  sx={{ width: '100%' }}
                  label={spec?.title}
                  variant="outlined"
                  {...registerFormFieldValue(spec.field, {
                    required: spec.required,
                  })}
                  defaultValue={spec?.default}
                ></TextField>
                <Box sx={{ m: 2 }} />
              </React.Fragment>
            )
          ) : spec.type === 'boolean' ? (
            <React.Fragment key={idx}>
              <Controller
                name={spec.field}
                control={control}
                rules={{ required: spec.required }}
                defaultValue={spec?.default}
                render={({ field: { value } }) => (
                  <Stack direction={'row'} alignItems="center" gap={'10%'}>
                    <Box>{spec.title}</Box>
                    <Switch
                      value={value}
                      onChange={(event, value) => {
                        setFormValue(spec.field, value);
                      }}
                    />
                  </Stack>
                )}
              />
              <Box sx={{ m: 2 }} />
            </React.Fragment>
          ) : spec.type === 'array' ? (
            <React.Fragment key={idx}>
              <Controller
                name={spec.field}
                control={control}
                rules={{ required: spec.required }}
                render={({ field: { value } }) => (
                  <MultiTagInput
                    field={spec.field}
                    label={spec.title}
                    fieldValueArr={value}
                    setFormValue={setFormValue}
                  />
                )}
              />
              <Box sx={{ m: 2 }} />
            </React.Fragment>
          ) : spec.type === 'integer' ? (
            <React.Fragment key={idx}>
              <TextField
                sx={{ width: '100%' }}
                label={spec?.title}
                variant="outlined"
                {...registerFormFieldValue(spec.field, {
                  required: spec.required,
                  valueAsNumber: true,
                })}
                defaultValue={spec?.default}
                type="number"
              ></TextField>
              <Box sx={{ m: 2 }} />
            </React.Fragment>
          ) : spec.type === 'object' ? (
            <React.Fragment key={idx}>
              <Controller
                name={spec.field}
                control={control}
                rules={{ required: spec?.required }}
                render={({ field }) => (
                  <Autocomplete
                    options={spec?.enum}
                    onChange={(e, data: any) => {
                      handleObjectFieldOnChange(data, spec.field, field);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        label={spec.title}
                      />
                    )}
                  />
                )}
              />
              <Box sx={{ m: 2 }} />
            </React.Fragment>
          ) : (
            ''
          )
        )}
    </>
  );
};